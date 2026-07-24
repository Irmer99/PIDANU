import logging
import random
import string
from typing import Optional

from fastapi import APIRouter, Depends, Form, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.nira_service import nira_service
from app.services.rate_limiter import rate_limiter
from app.utils.auth import hash_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ussd", tags=["ussd"])

user_sessions: dict[str, dict] = {}


def ussd_response(text: str) -> Response:
    return Response(content=text, media_type="text/plain")


def generate_pin() -> str:
    return "".join(random.choices(string.digits, k=4))


def generate_username(full_name: str) -> str:
    parts = full_name.strip().split()
    base = parts[0].lower() if parts else "citizen"
    num = "".join(random.choices(string.digits, k=4))
    return f"{base}{num}"


def build_main_menu(language: str = "eng") -> str:
    menus = {
        "eng": (
            "Welcome to PI-DANU\n"
            "1. Register for PDM\n"
            "2. Login to Portal\n"
            "3. Check Application Status\n"
            "4. Report a Scam\n"
            "5. Find Nearest PDR Office\n"
            "6. Change Language\n"
            "0. Exit"
        ),
        "lug": (
            "Tukusinze ku PI-DANU\n"
            "1. Wandikira mu PDM\n"
            "2. Yingira ku Portal\n"
            "3. Kye kipya ku application\n"
            "4. Nkulamba omutima\n"
            "5. Ofiisi eya PDR eyo lukwe\n"
            "6. Kyusa olulimi\n"
            "0. Toka"
        ),
        "nyn": (
            "Muramukutare e PI-DANU\n"
            "1. Andikira mu PDM\n"
            "2. Injira ku Portal\n"
            "3. Reba application yawe\n"
            "4. Nkengura obujenji\n"
            "5. Ofisi ya PDR eyedwa\n"
            "6. Kyuka olurimi\n"
            "0. Rongotha"
        ),
        "teo": (
            "Apwoyoose e PI-DANU\n"
            "1. Ngisio PDM\n"
            "2. Ngikiso ku Portal\n"
            "3. Ngikasin application\n"
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


def build_document_checklist(language: str = "eng") -> str:
    checklists = {
        "eng": (
            "Documents needed for PDM:\n"
            "1. National ID (NIN)\n"
            "2. Passport Photo\n"
            "3. Land Title (if any)\n"
            "4. Group Certificate\n"
            "5. Bank Account Details\n\n"
            "PDM registration is FREE!\n"
            "Do NOT pay anyone.\n\n"
            "Press 0 to go back"
        ),
        "lug": (
            "Ebikwatako ku PDM:\n"
            "1. Namba y'akalango (NIN)\n"
            "2. Ekifananyi\n"
            "3. Kyapa ky'ennyanja (kubonaako)\n"
            "4. Kyapa ky'awaka\n"
            "5. Namba ya bank\n\n"
            "Okuwandikira mu PDM kwa bwereere!\n"
            "Temulinde kubatuukirira.\n\n"
            "Kooyizde 0"
        ),
        "nyn": (
            "Ebintu ebikeneesho PDM:\n"
            "1. Namba y'akalango (NIN)\n"
            "2. Aka photo\n"
            "3. Kyapa y'omurongo (niba oli nayo)\n"
            "4. Kyapa y'awaka\n"
            "5. Namba ya bank\n\n"
            "Okuhandikisa mu PDM n'okwa busha!\n"
            "Mutashashura muntu weena.\n\n"
            "Kanyatera 0"
        ),
        "teo": (
            "Emia etyayakiso PDM:\n"
            "1. Namba ekalango (NIN)\n"
            "2. Asanusiye\n"
            "3. Kyapa y'omurongo (kabonaako)\n"
            "4. Kyapa y'omwoyo\n"
            "5. Namba ya bank\n\n"
            "Emia ngikiso PDM na ititai!\n"
            "Sirikitac idiotunganan.\n\n"
            "Apiyo 0"
        ),
    }
    return checklists.get(language, checklists["eng"])


def build_credentials_message(
    username: str, pin: str, full_name: str, language: str = "eng"
) -> str:
    messages = {
        "eng": (
            f"CON Account Created Successfully!\n\n"
            f"Name: {full_name}\n"
            f"Username: {username}\n"
            f"PIN: {pin}\n\n"
            f"IMPORTANT: Write down your username and PIN.\n"
            f"Use them to login at PI-DANU portal.\n\n"
            f"Next Steps:\n"
            f"Bring these documents to town:\n"
            f"1. National ID (NIN)\n"
            f"2. Passport Photo\n"
            f"3. Land Title (if any)\n"
            f"4. Bank Account Details\n\n"
            f"0-Back to menu"
        ),
        "lug": (
            f"CON Akawunti eyakoleddwa!\n\n"
            f"Name: {full_name}\n"
            f"Username: {username}\n"
            f"PIN: {pin}\n\n"
            f"KYOKWANISI: Kung'ana username ne PIN yo.\n"
            f"Oziikользe ku PI-DANU portal.\n\n"
            f"Enkya ogende nayo:\n"
            f"Teeta ebikwatako ku town:\n"
            f"1. Namba y'akalango (NIN)\n"
            f"2. Ekifananyi\n"
            f"3. Kyapa y'ennyanja (kubonaako)\n"
            f"4. Namba ya bank\n\n"
            f"0-Emmwe"
        ),
        "nyn": (
            f"CON Akawunti yakolebwa!\n\n"
            f"Name: {full_name}\n"
            f"Username: {username}\n"
            f"PIN: {pin}\n\n"
            f"KYOKWANISI: Kung'ana username ne PIN yo.\n"
            f"Ozikoze ku PI-DANU portal.\n\n"
            f"Emikono ogende nayo:\n"
            f"Teeta ebintu ebyo ku town:\n"
            f"1. Namba y'akalango (NIN)\n"
            f"2. Aka photo\n"
            f"3. Kyapa y'omurongo\n"
            f"4. Namba ya bank\n\n"
            f"0-Rongotha"
        ),
        "teo": (
            f"CON Akawunti etiakolebwa!\n\n"
            f"Name: {full_name}\n"
            f"Username: {username}\n"
            f"PIN: {pin}\n\n"
            f"KYOKWANISI: Taa username ne PIN yo.\n"
            f"Oziikoze ku PI-DANU portal.\n\n"
            f"Emikono ogende nayo:\n"
            f"Teeta emia etyayakiso ku town:\n"
            f"1. Namba ekalango (NIN)\n"
            f"2. Asanusiye\n"
            f"3. Kyapa y'omurongo\n"
            f"4. Namba ya bank\n\n"
            f"0-Apioi"
        ),
    }
    return messages.get(language, messages["eng"])


@router.api_route("", methods=["GET", "POST"])
@router.api_route("/callback", methods=["GET", "POST"])
async def ussd_handler(
    request: Request,
    sessionId: str = Form(default=None),
    serviceCode: str = Form(default=None),
    phoneNumber: str = Form(default=None),
    text: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
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
    if "data" not in session:
        session["data"] = {}
    data = session["data"]

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

    if step == "register_pin":
        if choice == "0":
            session["step"] = "menu"
            user_sessions[sessionId] = session
            return ussd_response(f"CON {build_main_menu(lang)}")

        pin = choice
        if len(pin) != 4 or not pin.isdigit():
            return ussd_response(f"CON PIN must be 4 digits.\nEnter your 4-digit PIN:")

        nira_result = data.get("nira_result", {})
        username = generate_username(nira_result.get("full_name", "citizen"))
        pin_hashed = hash_password(pin)

        user = User(
            nin=nira_result.get("nin", ""),
            full_name=nira_result.get("full_name", ""),
            parish=nira_result.get("parish", ""),
            village=nira_result.get("village"),
            district=nira_result.get("district", ""),
            phone_number=phoneNumber,
            pin_hash=pin_hashed,
            language_preference=lang,
        )
        db.add(user)
        await db.flush()

        msg = build_credentials_message(username, pin, user.full_name, lang)
        session["step"] = "menu"
        session["data"] = {}
        user_sessions[sessionId] = session
        return ussd_response(msg)

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
            nira_result = data.get("nira_result", {})
            existing = await db.execute(select(User).where(User.nin == nira_result.get("nin", "")))
            existing_user = existing.scalars().first()

            if existing_user and existing_user.pin_hash:
                session["step"] = "menu"
                session["data"] = {}
                user_sessions[sessionId] = session
                if lang == "lug":
                    return ussd_response(
                        f"CON Akawunti yo eyali yegadde.\n"
                        f"Use username ne PIN zo.\n\n{build_main_menu(lang)}"
                    )
                else:
                    return ussd_response(
                        f"CON Account already exists.\n"
                        f"Use your username and PIN to login.\n\n{build_main_menu(lang)}"
                    )

            session["step"] = "register_pin"
            user_sessions[sessionId] = session
            if lang == "lug":
                return ussd_response(
                    "CON Tegereza PIN yo e nnaku 4:\n"
                    "(Oma PIN yo ey'okulinnya)"
                )
            else:
                return ussd_response(
                    "CON Enter a 4-digit PIN for your account:\n"
                    "(This will be your login PIN)"
                )
        else:
            session["step"] = "nin_verify"
            user_sessions[sessionId] = session
            if lang == "lug":
                return ussd_response("CON Nkakasa NIN yange:\n(Oma namba yo)")
            else:
                return ussd_response("CON Enter your NIN:\n")

    if step == "login_nin":
        if choice == "0":
            session["step"] = "menu"
            user_sessions[sessionId] = session
            return ussd_response(f"CON {build_main_menu(lang)}")

        nin = choice
        result = await db.execute(select(User).where(User.nin == nin))
        user = result.scalars().first()

        if not user or not user.pin_hash:
            session["step"] = "menu"
            user_sessions[sessionId] = session
            if lang == "lug":
                return ussd_response(
                    f"CON Akawunti tetegeddeko.\nWandikira ku gamba 1.\n\n{build_main_menu(lang)}"
                )
            else:
                return ussd_response(
                    f"CON Account not found.\nRegister first using option 1.\n\n{build_main_menu(lang)}"
                )

        session["step"] = "login_pin"
        session["data"]["login_nin"] = nin
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response("CON Oma PIN yo:")
        else:
            return ussd_response("CON Enter your PIN:")

    if step == "login_pin":
        if choice == "0":
            session["step"] = "menu"
            session["data"] = {}
            user_sessions[sessionId] = session
            return ussd_response(f"CON {build_main_menu(lang)}")

        pin_input = choice
        login_nin = data.get("login_nin", "")
        result = await db.execute(select(User).where(User.nin == login_nin))
        user = result.scalars().first()

        from app.utils.auth import verify_password
        if user and verify_password(pin_input, user.pin_hash):
            session["step"] = "menu"
            session["data"] = {}
            user_sessions[sessionId] = session
            portal_url = "https://pi-danu.example.com"
            if lang == "lug":
                return ussd_response(
                    f"CON Nkola ntya, {user.full_name}!\n\n"
                    f"Login ku PI-DANU portal:\n"
                    f"URL: {portal_url}\n"
                    f"Username: {login_nin}\n"
                    f"PIN: ****\n\n"
                    f"Ebikwatako okuteera:\n"
                    f"1. National ID (NIN)\n"
                    f"2. Ekifananyi\n"
                    f"3. Kyapa y'ennyanja\n"
                    f"4. Namba ya bank\n\n"
                    f"Nkola buli kintu online.\n\n{build_main_menu(lang)}"
                )
            else:
                return ussd_response(
                    f"CON Welcome back, {user.full_name}!\n\n"
                    f"Login to PI-DANU portal:\n"
                    f"URL: {portal_url}\n"
                    f"Username: {login_nin}\n"
                    f"PIN: ****\n\n"
                    f"Bring to town:\n"
                    f"1. National ID (NIN)\n"
                    f"2. Passport Photo\n"
                    f"3. Land Title (if any)\n"
                    f"4. Bank Account Details\n\n"
                    f"Everything is online.\n\n{build_main_menu(lang)}"
                )
        else:
            session["step"] = "login_nin"
            session["data"] = {}
            user_sessions[sessionId] = session
            if lang == "lug":
                return ussd_response(f"CON PIN eyo siyo.\n0-Emmwe")
            else:
                return ussd_response(f"CON Wrong PIN.\n0-Back")

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
        session["step"] = "nin_verify"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response("CON Nkakasa NIN yange:\n(Oma namba yo yo)")
        else:
            return ussd_response("CON Enter your National ID Number (NIN):\n")

    elif choice == "2":
        session["step"] = "login_nin"
        user_sessions[sessionId] = session
        if lang == "lug":
            return ussd_response("CON Oma NIN yo:")
        else:
            return ussd_response("CON Enter your NIN to login:\n")

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
        return ussd_response("END Thank you for using PI-DANU.\nWebale nyo!")

    return ussd_response(f"CON {build_main_menu(lang)}")


@router.get("/stats")
async def ussd_stats():
    total_sessions = len(user_sessions)
    languages = {}
    for s in user_sessions.values():
        lang = s.get("language", "eng")
        languages[lang] = languages.get(lang, 0) + 1

    return {
        "total_sessions": total_sessions,
        "active_sessions": total_sessions,
        "languages": [{"language": k, "count": v} for k, v in languages.items()],
    }
