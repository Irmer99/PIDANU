import logging
import re
from typing import Optional

from fastapi import APIRouter, Form, Request, Response

from app.services.chat_service import chat_service
from app.services.nira_service import nira_service
from app.services.rate_limiter import rate_limiter
from app.services.sunbird_ai import sunbird_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ussd", tags=["ussd"])

user_sessions: dict[str, dict] = {}


def ussd_response(text: str) -> Response:
    return Response(content=text, media_type="text/plain")


def build_main_menu(language: str = "eng") -> str:
    menus = {
        "eng": (
            "Welcome to PDM AI Bridge\n"
            "1. Join PDM (Registration Info)\n"
            "2. Verify My National ID\n"
            "3. Check Application Status\n"
            "4. Report a Scam\n"
            "5. Find Nearest PDR Office\n"
            "6. Change Language\n"
            "0. Exit"
        ),
        "lug": (
            "Tukusinze ku PDM AI Bridge\n"
            "1. Njagala okuyingira mu PDM\n"
            "2. Nkakasa NIN yange\n"
            "3. Namba ya pulokola yange\n"
            "4. Nkulamba omutima\n"
            "5. Ofiisi eya PDR eyo lukwe\n"
            "6. Kyusa olulimi\n"
            "0. Toka"
        ),
        "nyn": (
            "Muramukutare e PDM AI Bridge\n"
            "1. Ndikunda okuza mu PDM\n"
            "2. Nkakase NIN yange\n"
            "3. Enamba y'okubungoza kwange\n"
            "4. Nkengura obujenji\n"
            "5. Ofisi ya PDR eyedwa\n"
            "6. Kyuka olurimi\n"
            "0. Rongotha"
        ),
        "teo": (
            "Apwoyoose e PDM AI Bridge\n"
            "1. Emia ngikiso PDM\n"
            "2. Ngikakasin NIN amwe\n"
            "3. Nambar eti application\n"
            "4. Ngipar alopurur\n"
            "5. PDR office ngiyongola\n"
            "6. Kyosa kaloi\n"
            "0. Apioi"
        ),
    }
    return menus.get(language, menus["eng"])


def build_language_menu() -> str:
    return (
        "Choose Your Language / Kyusa Olulimi\n"
        "1. English\n"
        "2. Luganda\n"
        "3. Runyankole\n"
        "4. Ateso\n"
        "0. Back"
    )


def build_document_checklist() -> str:
    return (
        "Documents needed for PDM:\n"
        "1. National ID (NIN)\n"
        "2. Passport Photo\n"
        "3. Land Title (if any)\n"
        "4. Group Certificate\n"
        "5. Bank Account Details\n\n"
        "PDM registration is FREE!\n"
        "Do NOT pay anyone.\n\n"
        "Press 0 to go back"
    )


@router.api_route("", methods=["GET", "POST"])
@router.api_route("/callback", methods=["GET", "POST"])
async def ussd_handler(
    request: Request,
    sessionId: str = Form(default=None),
    serviceCode: str = Form(default=None),
    phoneNumber: str = Form(default=None),
    text: str = Form(default=""),
):
    if request.method == "GET":
        params = dict(request.query_params)
        sessionId = params.get("sessionId", params.get("session_id", ""))
        serviceCode = params.get("serviceCode", params.get("service_code", ""))
        phoneNumber = params.get("phoneNumber", params.get("phone_number", params.get("phone", "")))
        text = params.get("text", params.get("input", ""))

    if not sessionId:
        return Response(content="END Invalid request. Missing sessionId.", media_type="text/plain")
    if rate_limiter.check_ussd(phoneNumber):
        return Response(
            content="END Too many requests. Please try again later.",
            media_type="text/plain",
            status_code=429,
        )

    session = user_sessions.get(sessionId, {})
    lang = session.get("language", "eng")
    step = session.get("step", "menu")
    data = session.get("data", {})

    parts = text.split("*") if text else []
    choice = parts[-1] if parts else ""

    if step == "language_select":
        lang_map = {"1": "eng", "2": "lug", "3": "nyn", "4": "teo"}
        if choice in lang_map:
            lang = lang_map[choice]
            session["language"] = lang
            session["step"] = "menu"
            user_sessions[sessionId] = session
            return ussd_response(f"CON {build_main_menu(lang)}")
        return ussd_response(f"CON {build_language_menu()}")

    if step == "nin_verify":
        if choice == "0":
            session["step"] = "menu"
            user_sessions[sessionId] = session
            return ussd_response(f"CON {build_main_menu(lang)}")

        nin = choice
        nira_result = await nira_service.verify_nin(nin)

        if nira_result["found"]:
            name = nira_result["full_name"]
            parish = nira_result["parish"]
            district = nira_result["district"]

            if lang == "lug":
                msg = (
                    f"Twawulira nti:\n"
                    f"Name: {name}\n"
                    f"Parish: {parish}\n"
                    f"District: {district}\n"
                    f"Kiwululu? 1-Yee 2-Nedda"
                )
            else:
                msg = (
                    f"We found your details:\n"
                    f"Name: {name}\n"
                    f"Parish: {parish}\n"
                    f"District: {district}\n"
                    f"Is this correct? 1-Yes 2-No"
                )

            session["step"] = "nin_confirm"
            session["data"]["nira_result"] = nira_result
            user_sessions[sessionId] = session
            return ussd_response(f"CON {msg}")
        else:
            if lang == "lug":
                msg = "NIN eyo siyo. Kyusa namba lyo n'ogende.\n0-Emmwe"
            else:
                msg = "NIN not found. Check your number and try again.\n0-Back"
            return ussd_response(f"CON {msg}")

    if step == "nin_confirm":
        if choice == "1":
            session["step"] = "menu"
            user_sessions[sessionId] = session
            if lang == "lug":
                return ussd_response(f"CON Tusse! Namba yo twaitaako.\n{build_main_menu(lang)}")
            else:
                return ussd_response(f"CON Great! Your details are verified.\n{build_main_menu(lang)}")
        else:
            session["step"] = "nin_verify"
            user_sessions[sessionId] = session
            if lang == "lug":
                return ussd_response("CON Nkakasa NIN yange:\n(Oma namba yo)")
            else:
                return ussd_response("CON Enter your NIN:\n")

    if step == "check_status":
        session["step"] = "menu"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response(
                f"CON Kye kipya:\nNakola application nga ddala.\n"
                f"Linda okuwona omukono gw'omulamwo.\n\n{build_main_menu(lang)}"
            )
        else:
            return ussd_response(
                f"CON Status Update:\nYour application is being processed.\n"
                f"Wait for field evaluation.\n\n{build_main_menu(lang)}"
            )

    if step == "find_office":
        session["step"] = "menu"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response(
                f"CON Ofiisi eya PDR eyo lukwe:\n"
                f"1. Kampala - Kawempe\n"
                f"2. Mukono - Kisowera\n"
                f"3. Mbarara - Kakyeka\n"
                f"4. Lira - Ojwina\n"
                f"5. Gulu - Layibi\n"
                f"6. Jinja - Njinikubi\n"
                f"7. Mbale - Nasenyi\n"
                f"8. Soroti - Ogooma\n\n{build_main_menu(lang)}"
            )
        else:
            return ussd_response(
                f"CON Nearest PDR Offices:\n"
                f"1. Kampala - Kawempe\n"
                f"2. Mukono - Kisowera\n"
                f"3. Mbarara - Kakyeka\n"
                f"4. Lira - Ojwina\n"
                f"5. Gulu - Layibi\n"
                f"6. Jinja - Njinikubi\n"
                f"7. Mbale - Nasenyi\n"
                f"8. Soroti - Ogooma\n\n{build_main_menu(lang)}"
            )

    if choice == "":
        return ussd_response(f"CON {build_main_menu(lang)}")

    if choice == "1":
        session["step"] = "menu"
        user_sessions[sessionId] = session
        return ussd_response(f"CON {build_document_checklist()}")

    elif choice == "2":
        session["step"] = "nin_verify"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response("CON Nkakasa NIN yange:\n(Oma namba yo yo)")
        else:
            return ussd_response("CON Enter your National ID Number (NIN):\n")

    elif choice == "3":
        session["step"] = "check_status"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response("CON Namba ya pulokola:\n(Oma application ID yo)")
        else:
            return ussd_response("CON Enter your Application ID:\n")

    elif choice == "4":
        session["step"] = "menu"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response(
                "CON BULI MMISI!! PDM ekikolwa n'ekyuma.\n"
                "Temulinde kubatuukirira.\n"
                "Olwereza buli muntu oyo agenda kukusaba sente.\n"
                "Kibeera buvuneemitwa!\n\n"
                "Olwokubuulira: 0800-XXX-XXX\n\n0-Emmwe"
            )
        else:
            return ussd_response(
                "CON SCAM WARNING!\n"
                "PDM registration is FREE.\n"
                "Do NOT pay anyone for forms.\n"
                "Report scams to: 0800-XXX-XXX\n\n0-Back"
            )

    elif choice == "5":
        session["step"] = "find_office"
        user_sessions[sessionId] = session
        return ussd_response("CON ...loading offices...")

    elif choice == "6":
        session["step"] = "language_select"
        user_sessions[sessionId] = session
        return ussd_response(f"CON {build_language_menu()}")

    elif choice == "0":
        return ussd_response("END Thank you for using PDM AI Bridge.\nWebale nyo!")

    return ussd_response(f"CON {build_main_menu(lang)}")
