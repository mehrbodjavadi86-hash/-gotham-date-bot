import os
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

TOKEN = os.getenv('BOT_TOKEN', 'PASTE_BOT_TOKEN_HERE')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID', 'PASTE_YOUR_CHAT_ID_HERE')

MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
PLACES = {'cafe':'☕ کافه','batmobile':'🦇 دور دور با بتموبیل','decide':'🤷 همون موقع تصمیم می‌گیریم'}

def month_keyboard():
    return InlineKeyboardMarkup([[InlineKeyboardButton(m, callback_data=f'month:{i+1}') for i,m in enumerate(MONTHS[:4])],
        [InlineKeyboardButton(m, callback_data=f'month:{i+1}') for i,m in enumerate(MONTHS[4:8], start=4)],
        [InlineKeyboardButton(m, callback_data=f'month:{i+1}') for i,m in enumerate(MONTHS[8:], start=8)]])

def day_keyboard(month):
    days = 31 if month <= 6 else (30 if month <= 11 else 29)
    rows=[]
    for start in range(1, days+1, 7):
        rows.append([InlineKeyboardButton(str(d), callback_data=f'day:{month}:{d}') for d in range(start,min(start+7,days+1))])
    rows.append([InlineKeyboardButton('⬅️ ماه‌ها', callback_data='back:months')])
    return InlineKeyboardMarkup(rows)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    kb=InlineKeyboardMarkup([[InlineKeyboardButton('🦇 آره، بریم!', callback_data='yes')],[InlineKeyboardButton('😐 نه', callback_data='no')]])
    await update.message.reply_text('🦇 GOTHAM DATE 🦇\n\nبتمن یه سؤال خیلی مهم داره...\n\nبا بتمن دیت میایی بری؟', reply_markup=kb)

async def callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    data=q.data
    if data=='yes':
        await q.edit_message_text('🦇 عالیه! حالا تاریخ دیت رو انتخاب کن:\n\nماه رو انتخاب کن 👇', reply_markup=month_keyboard())
    elif data=='no':
        await q.edit_message_text('😐 انتخابت محترمه...\n\nولی بتمن هنوز امیدشو از دست نداده 🦇\n\nاگه نظرت عوض شد دوباره /start رو بزن.')
    elif data=='back:months':
        await q.edit_message_text('ماه رو انتخاب کن 👇', reply_markup=month_keyboard())
    elif data.startswith('month:'):
        m=int(data.split(':')[1]); context.user_data['month']=m
        await q.edit_message_text(f'📅 {MONTHS[m-1]}\n\nروز رو انتخاب کن 👇', reply_markup=day_keyboard(m))
    elif data.startswith('day:'):
        _,m,d=data.split(':'); context.user_data['date']=f'{int(d)} {MONTHS[int(m)-1]}'
        kb=InlineKeyboardMarkup([[InlineKeyboardButton('☕ کافه',callback_data='place:cafe')],[InlineKeyboardButton('🦇 دور دور با بتموبیل',callback_data='place:batmobile')],[InlineKeyboardButton('🤷 همون موقع تصمیم می‌گیریم',callback_data='place:decide')]])
        await q.edit_message_text(f'📅 تاریخ انتخاب شد: {context.user_data["date"]}\n\nحالا مکان رو انتخاب کن 📍', reply_markup=kb)
    elif data.startswith('place:'):
        key=data.split(':')[1]; context.user_data['place']=PLACES[key]
        kb=InlineKeyboardMarkup([[InlineKeyboardButton('🦇 این روز و مکان رو تأیید می‌کنم',callback_data='confirm')],[InlineKeyboardButton('⬅️ انتخاب دوباره مکان',callback_data='retryplace')]])
        await q.edit_message_text(f'📅 {context.user_data["date"]}\n📍 {context.user_data["place"]}\n\nهمه‌چی آماده‌ست. تأیید می‌کنی؟', reply_markup=kb)
    elif data=='retryplace':
        kb=InlineKeyboardMarkup([[InlineKeyboardButton('☕ کافه',callback_data='place:cafe')],[InlineKeyboardButton('🦇 دور دور با بتموبیل',callback_data='place:batmobile')],[InlineKeyboardButton('🤷 همون موقع تصمیم می‌گیریم',callback_data='place:decide')]])
        await q.edit_message_text('📍 مکان رو انتخاب کن:', reply_markup=kb)
    elif data=='confirm':
        date=context.user_data.get('date'); place=context.user_data.get('place')
        if not date or not place:
            await q.edit_message_text('یه چیزی ناقصه 😅 دوباره /start رو بزن.')
            return
        user=update.effective_user
        msg=f'🚨 BAT-SIGNAL 🚨\n\nیک نفر دیت رو تأیید کرد! 🦇\n\n📅 تاریخ: {date}\n📍 مکان: {place}\n👤 Telegram: @{user.username or "بدون یوزرنیم"}\n🆔 User ID: {user.id}'
        if ADMIN_CHAT_ID.startswith('PASTE_'):
            await q.edit_message_text('🦇 دیت با موفقیت ثبت شد!\n\n(ارسال اعلان برای صاحب بات هنوز تنظیم نشده.)')
        else:
            await context.bot.send_message(chat_id=ADMIN_CHAT_ID, text=msg)
            await q.edit_message_text('🦇 ثبت شد!\n\nبتمن از تصمیم شما باخبر شد. 🚨🦇')

if __name__=='__main__':
    if 'PASTE_' in TOKEN:
        print('BOT_TOKEN را تنظیم کن.')
    app=Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler('start', start))
    app.add_handler(CallbackQueryHandler(callback))
    app.run_polling()
