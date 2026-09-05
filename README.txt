import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN پیدا نشد")


MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
]

LOCATIONS = {
    "cafe": "☕ کافه",
    "batmobile": "🦇 دور دور با بتموبیل",
    "decide": "🎲 همون موقع تصمیم می‌گیریم"
}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton("😎 آره میام", callback_data="yes"),
            InlineKeyboardButton("😐 نه", callback_data="no")
        ]
    ]

    await update.message.reply_text(
        "🦇 با بتمن دیت میایی بری؟",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    data = query.data

    if data == "no":
        await query.message.reply_text(
            "😔 حتی بتمن هم اینو انتظار نداشت...\nباشه، فعلاً 🦇"
        )
        return

    if data == "yes":
        keyboard = []

        for i in range(0, 12, 3):
            row = []

            for j in range(i, min(i + 3, 12)):
                row.append(
                    InlineKeyboardButton(
                        MONTHS[j],
                        callback_data=f"month_{j + 1}"
                    )
                )

            keyboard.append(row)

        await query.message.reply_text(
            "🦇 عالیه!\nحالا ماه دیت رو انتخاب کن:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    if data.startswith("month_"):
        month = int(data.split("_")[1])

        keyboard = []

        for i in range(1, 32, 7):
            row = []

            for day in range(i, min(i + 7, 32)):
                row.append(
                    InlineKeyboardButton(
                        str(day),
                        callback_data=f"day_{month}_{day}"
                    )
                )

            keyboard.append(row)

        await query.message.reply_text(
            f"📅 ماه {MONTHS[month - 1]} انتخاب شد.\nحالا روز رو انتخاب کن:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    if data.startswith("day_"):
        _, month, day = data.split("_")

        keyboard = [
            [
                InlineKeyboardButton(
                    "☕ کافه",
                    callback_data=f"place_{month}_{day}_cafe"
                )
            ],
            [
                InlineKeyboardButton(
                    "🦇 دور دور با بتموبیل",
                    callback_data=f"place_{month}_{day}_batmobile"
                )
            ],
            [
                InlineKeyboardButton(
                    "🎲 همون موقع تصمیم می‌گیریم",
                    callback_data=f"place_{month}_{day}_decide"
                )
            ]
        ]

        await query.message.reply_text(
            f"📅 تاریخ انتخابی:\n{day} {MONTHS[int(month) - 1]}\n\n"
            "حالا محل دیت رو انتخاب کن:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    if data.startswith("place_"):
        _, month, day, place = data.split("_")

        keyboard = [
            [
                InlineKeyboardButton(
                    "✅ تأیید",
                    callback_data=f"confirm_{month}_{day}_{place}"
                )
            ],
            [
                InlineKeyboardButton(
                    "🔄 دوباره انتخاب می‌کنم",
                    callback_data="yes"
                )
            ]
        ]

        await query.message.reply_text(
            f"🦇 تاریخ: {day} {MONTHS[int(month) - 1]}\n"
            f"📍 مکان: {LOCATIONS[place]}\n\n"
            "همه‌چی اوکیه؟",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    if data.startswith("confirm_"):
        _, month, day, place = data.split("_")

        admin_chat_id = os.getenv("ADMIN_CHAT_ID")

        user = query.from_user

        message = (
            "🦇 دیت جدید!\n\n"
            f"📅 تاریخ: {day} {MONTHS[int(month) - 1]}\n"
            f"📍 مکان: {LOCATIONS[place]}\n\n"
            f"👤 نام: {user.first_name or '-'}\n"
            f"🆔 Username: @{user.username or '-'}\n"
            f"💬 Chat ID: {query.message.chat.id}"
        )

        if admin_chat_id:
            try:
                await context.bot.send_message(
                    chat_id=admin_chat_id,
                    text=message
                )
            except Exception as error:
                print("Admin message error:", error)

        await query.message.reply_text(
            "🦇 ثبت شد!\n\n"
            "بتمن تاریخ دیت رو توی BatComputer ذخیره کرد. 😎\n\n"
            "حالا فقط مونده سر قرار حاضر شی... 🦇"
        )


def main():
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button))

    print("🦇 Gotham Date Bot is running...")

    application.run_polling()


if __name__ == "__main__":
    main()
