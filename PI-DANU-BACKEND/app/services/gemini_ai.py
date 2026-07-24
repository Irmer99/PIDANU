import json
import logging
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

PDM_SYSTEM_PROMPT = """You are PI-DANU, an AI assistant helping Ugandan citizens register for the Parish Development Model (PDM).

Your job is to guide citizens through the PDM registration process by chatting with them. You help fill out their application form by asking questions one at a time.

CRITICAL RULES:
- Always respond in the citizen's language (default: English, but switch to Luganda, Runyankole, or Ateso if they write in those languages)
- Ask ONE question at a time - be patient and friendly
- After each answer, acknowledge it and move to the next question
- When you have all the info, tell them what documents to upload
- NEVER ask for money - PDM registration is FREE
- Be warm, respectful, use simple language

REGISTRATION FORM FIELDS (ask these one by one):
1. Full Name (you may already have this from NIN)
2. Phone Number
3. Village
4. Parish
5. District
6. Occupation (farmer, trader, etc.)
7. Group Name (if applying as a group)
8. Type of PDM activity (agriculture, fisheries, manufacturing, services)
9. Amount needed (in UGX)

After collecting all info, tell them to upload:
- National ID photo
- Passport photo
- Land title (if they have one)
- Bank details

IMPORTANT: When you have collected form data, output a JSON block at the end like:
<!--FORM_DATA:{"field": "value"}-->

This tells the system what data was collected. Always include this when you have new info.

Be conversational. Use Ugandan English patterns. Say "Good morning" etc. Be like a helpful parish chief."""


class GeminiAIService:
    def __init__(self):
        self.client = None
        self.chat_sessions: Dict[str, List] = {}
        self._init_client()

    def _init_client(self):
        api_key = settings.GEMINI_API_KEY
        if api_key and len(api_key) > 10:
            try:
                from google import genai
                self.client = genai.Client(api_key=api_key)
                logger.info("Gemini client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to init Gemini client: {e}")
                self.client = None
        else:
            logger.info("No valid Gemini API key - using fallback mode")

    def _get_history(self, user_id: str) -> List:
        if user_id not in self.chat_sessions:
            self.chat_sessions[user_id] = []
        return self.chat_sessions[user_id]

    def _fallback_chat(self, user_id: str, message: str, user_context: Optional[Dict], language: str) -> Dict[str, Any]:
        """Smart fallback when Gemini API is unavailable"""
        history = self._get_history(user_id)
        lower_msg = message.lower().strip()

        # Simple intent detection
        if any(w in lower_msg for w in ["hi", "hello", "hey", "muno", "ojambo"]):
            name = user_context.get("full_name", "there") if user_context else "there"
            replies = {
                "eng": f"Hello {name}! Welcome to PI-DANU. I'm here to help you register for PDM. How can I help you today?",
                "lug": f"Nkulamusizza {name}! Musanise ku PI-DANU. Nze ndiyo nkuyamba okuwandika ku PDM. Nkisobola kuyamba ki?",
                "nyn": f"Turibwabo {name}! Murakwiza ku PI-DANU. Nze nda nkuyamba kwandika mu PDM. Ninkukuyambaki?",
                "teo": f"Agai {name}! Awo oongedoi PI-DANU. Nanai ekidodo aminoi. Ai nengajani arioi?",
            }
            reply = replies.get(language, replies["eng"])
        elif any(w in lower_msg for w in ["status", "check", "progress", "bweki", "kyukola"]):
            reply = "To check your application status, go to the Status tab in your dashboard. You can see all your documents and application progress there."
        elif any(w in lower_msg for w in ["register", "signup", "andika", "kwandika"]):
            reply = "To register for PDM, please go to the AI Chat tab and I'll help you fill out the form step by step. We'll collect your information one question at a time."
        elif any(w in lower_msg for w in ["document", "upload", "files", "lwatu", "nyonyola"]):
            reply = "You can upload your documents in the Documents tab. We need: National ID, passport photo, land title (optional), and bank details."
        elif any(w in lower_msg for w in ["thank", "webale", "nkwatakye"]):
            reply = "You're welcome! I'm here to help whenever you need. Is there anything else you'd like to know about PDM registration?"
        else:
            replies = {
                "eng": "Thank you for your message. I can help you with PDM registration. You can ask me about the registration process, upload documents, or check your application status.",
                "lug": "Nwebale ku kigambo kyo. Nsobola okukuyamba ne ku kwandika ku PDM. Osaba ku nkyuukirira, nnyonyola, oba okuleeta obulambe obwa application yo.",
                "nyn": "Twebweba ku kagambo kyo. Nsobola kukuyamba no mu kwandika mu PDM. Soroka ku mikono, kuzinga, oba kukaraba.",
                "teo": "Awo ngaisi ooi. Nanai aminoi ekidodo arioi. Ngai akini arioi ejei edoi.",
            }
            reply = replies.get(language, replies["eng"])

        history.append({"role": "user", "text": message})
        history.append({"role": "assistant", "text": reply})
        if len(history) > 50:
            self.chat_sessions[user_id] = history[-30:]

        return {"reply": reply, "form_data": None, "language": language}

    async def chat(
        self,
        user_id: str,
        message: str,
        user_context: Optional[Dict] = None,
        language: str = "eng",
    ) -> Dict[str, Any]:
        # If no Gemini client, use fallback
        if not self.client:
            return self._fallback_chat(user_id, message, user_context, language)

        history = self._get_history(user_id)

        context_str = ""
        if user_context:
            context_str = (
                f"\n\nCITIZEN INFO:\n"
                f"Name: {user_context.get('full_name', 'Unknown')}\n"
                f"NIN: {user_context.get('nin', 'Unknown')}\n"
                f"Parish: {user_context.get('parish', 'Unknown')}\n"
                f"District: {user_context.get('district', 'Unknown')}\n"
                f"Phone: {user_context.get('phone_number', 'Unknown')}\n"
                f"Language: {language}\n"
            )

        system_instruction = PDM_SYSTEM_PROMPT + context_str

        lang_hint = {
            "eng": "Respond in English.",
            "lug": "Respond in Luganda.",
            "nyn": "Respond in Runyankole.",
            "teo": "Respond in Ateso.",
        }.get(language, "Respond in English.")

        full_message = f"{lang_hint}\n\nUser: {message}"

        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            from google.genai import types
            contents.append(types.Content(
                role=role,
                parts=[types.Part(text=msg["text"])]
            ))
        from google.genai import types
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=full_message)]
        ))

        try:
            from google.genai import types
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                    max_output_tokens=1024,
                ),
            )

            reply_text = response.text or "I'm sorry, I didn't understand that. Can you repeat?"

            history.append({"role": "user", "text": full_message})
            history.append({"role": "assistant", "text": reply_text})

            if len(history) > 50:
                self.chat_sessions[user_id] = history[-30:]

            form_data = None
            if "<!--FORM_DATA:" in reply_text:
                try:
                    start = reply_text.index("<!--FORM_DATA:") + 14
                    end = reply_text.index("-->", start)
                    form_json = reply_text[start:end]
                    form_data = json.loads(form_json)
                    reply_text = reply_text[:reply_text.index("<!--FORM_DATA:")].strip()
                except Exception:
                    pass

            return {
                "reply": reply_text,
                "form_data": form_data,
                "language": language,
            }

        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            # Fall back to smart chatbot
            return self._fallback_chat(user_id, message, user_context, language)

    def clear_history(self, user_id: str):
        self.chat_sessions.pop(user_id, None)


gemini_service = GeminiAIService()
