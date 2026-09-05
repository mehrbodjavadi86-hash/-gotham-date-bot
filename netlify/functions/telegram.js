const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const LOCATIONS = {
  cafe: "☕ کافه",
  batmobile: "🦇 دور دور با بتموبیل",
  decide: "🎲 همون موقع تصمیم می‌گیریم"
};

export default async (req) => {
  if (req.method === "GET") {
    return new Response("🦇 Gotham Date Bot is ONLINE!", {
      status: 200
    });
  }

  try {
    const update = await req.json();

    if (update.message) {
      await handleMessage(update.message);
    }

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response("OK", { status: 200 });
  }
};

async function telegram(method, data) {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error("BOT_TOKEN پیدا نشد");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  return response.json();
}

async function sendMessage(chatId, text, keyboard = null) {
  const data = {
    chat_id: chatId,
    text
  };

  if (keyboard) {
    data.reply_markup = {
      inline_keyboard: keyboard
    };
  }

  return telegram("sendMessage", data);
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/id") {
    await sendMessage(
      chatId,
      `🆔 Chat ID شما:\n${chatId}`
    );
    return;
  }

  if (text === "/start") {
    await sendMessage(
      chatId,
      "🦇 با بتمن دیت میایی بری؟",
      [
        [
          { text: "😎 آره میام", callback_data: "yes" },
          { text: "😐 نه", callback_data: "no" }
        ]
      ]
    );
  }
}

async function handleCallback(query) {
  const chatId = query.message.chat.id;
  const data = query.data;

  await telegram("answerCallbackQuery", {
    callback_query_id: query.id
  });

  if (data === "no") {
    await sendMessage(
      chatId,
      "😔 حتی بتمن هم اینو انتظار نداشت...\nباشه، فعلاً 🦇"
    );
    return;
  }

  if (data === "yes") {
    await sendMessage(
      chatId,
      "🦇 عالیه!\nحالا ماه دیت رو انتخاب کن:",
      makeMonthKeyboard()
    );
    return;
  }

  if (data.startsWith("month_")) {
    const month = Number(data.split("_")[1]);

    await sendMessage(
      chatId,
      `📅 ماه ${MONTHS[month - 1]} انتخاب شد.\nحالا روز رو انتخاب کن:`,
      makeDayKeyboard(month)
    );
    return;
  }

  if (data.startsWith("day_")) {
    const [, month, day] = data.split("_");

    await sendMessage(
      chatId,
      `📅 تاریخ انتخابی:\n${day} ${MONTHS[Number(month) - 1]}\n\nحالا محل دیت رو انتخاب کن:`,
      [
        [
          {
            text: LOCATIONS.cafe,
            callback_data: `place_${month}_${day}_cafe`
          }
        ],
        [
          {
            text: LOCATIONS.batmobile,
            callback_data: `place_${month}_${day}_batmobile`
          }
        ],
        [
          {
            text: LOCATIONS.decide,
            callback_data: `place_${month}_${day}_decide`
          }
        ]
      ]
    );
    return;
  }

  if (data.startsWith("place_")) {
    const [, month, day, place] = data.split("_");

    await sendMessage(
      chatId,
      `🦇 تاریخ: ${day} ${MONTHS[Number(month) - 1]}\n` +
      `📍 مکان: ${LOCATIONS[place]}\n\n` +
      `همه‌چی اوکیه؟`,
      [
        [
          {
            text: "✅ تأیید",
            callback_data: `confirm_${month}_${day}_${place}`
          }
        ],
        [
          {
            text: "🔄 دوباره انتخاب می‌کنم",
            callback_data: "yes"
          }
        ]
      ]
    );
    return;
  }

  if (data.startsWith("confirm_")) {
    const [, month, day, place] = data.split("_");

    const user = query.from;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    const adminMessage =
      `🦇 دیت جدید!\n\n` +
      `📅 تاریخ: ${day} ${MONTHS[Number(month) - 1]}\n` +
      `📍 مکان: ${LOCATIONS[place]}\n\n` +
      `👤 نام: ${user.first_name || "-"}\n` +
      `🆔 Username: @${user.username || "-"}\n` +
      `💬 Chat ID: ${chatId}`;

    if (adminChatId) {
      await sendMessage(adminChatId, adminMessage);
    }

    await sendMessage(
      chatId,
      "🦇 ثبت شد!\n\n" +
      "بتمن تاریخ دیت رو توی BatComputer ذخیره کرد. 😎\n\n" +
      "حالا فقط مونده سر قرار حاضر شی... 🦇"
    );
  }
}

function makeMonthKeyboard() {
  const keyboard = [];

  for (let i = 0; i < MONTHS.length; i += 3) {
    keyboard.push(
      MONTHS.slice(i, i + 3).map((month, index) => ({
        text: month,
        callback_data: `month_${i + index + 1}`
      }))
    );
  }

  return keyboard;
}

function makeDayKeyboard(month) {
  const days = [];

  for (let i = 1; i <= 31; i += 7) {
    const row = [];

    for (let j = i; j < i + 7 && j <= 31; j++) {
      row.push({
        text: String(j),
        callback_data: `day_${month}_${j}`
      });
    }

    days.push(row);
  }

  return days;
}
