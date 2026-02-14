export type Language = "en" | "ru";

export const LANGUAGE_STORAGE_KEY = "raiku_language";

type Translation = {
  siteTitle: string;
  shareTitle: string;
  shareDescription: string;
  header: {
    foreverInHeart: string;
    connectDiscord: string;
    disconnectDiscord: string;
    about: string;
    close: string;
    aboutCredit: string;
    aboutCreditRu: string;
    conceptCredit: string;
  };
  wall: {
    connectHint: string;
    chooseDragon: string;
    chooseRandomDragon: string;
    rouletteSpinning: string;
    quickSearchTitle: string;
    quickSearchPlaceholder: string;
    noPublishedFound: string;
    unknownUser: string;
    rouletteDialogLabel: string;
    rouletteTitle: string;
    dragonListDialogLabel: string;
    chooseDragonModalTitle: string;
    addingToWall: string;
    assignPreviewLabel: string;
    chooseAnother: string;
    saving: string;
    uploading: string;
    confirmChoice: string;
    uploadFailed: string;
    fileTooLarge: string;
    networkError: string;
    networkOrServerError: string;
    assignFailed: string;
    noFreeSlot: string;
    shareButton: string;
    shareModalTitle: string;
    shareTelegram: string;
    shareTwitter: string;
    shareFacebook: string;
    shareCopyLink: string;
    shareNative: string;
    shareCopied: string;
    shareCopyFailed: string;
    shareOpenFailed: string;
  };
  notFound: {
    title: string;
    text: string;
    home: string;
  };
};

export const translations: Record<Language, Translation> = {
  en: {
    siteTitle: "Raiku Graffiti",
    shareTitle: "Raiku Graffiti",
    shareDescription: "Leave your mark. Become part of the Raiku",
    header: {
      foreverInHeart: "Forever in Raiku's Heart",
      connectDiscord: "Connect to Discord",
      disconnectDiscord: "Disconnect",
      about: "About",
      close: "Close",
      aboutCredit:
        "The full development, structuring, practical adaptation, implementation of the project and sticker design were carried out by",
      aboutCreditRu:
        "The full development, structuring, practical adaptation, implementation of the project and sticker design were carried out by",
      conceptCredit: "The project is based on a conceptual idea proposed by",
    },
    wall: {
      connectHint: "Connect to Discord",
      chooseDragon: "Choose your dragon",
      chooseRandomDragon: "Choose random dragon",
      rouletteSpinning: "Roulette is spinning...",
      quickSearchTitle: "Published dragons quick search",
      quickSearchPlaceholder: "Search by Discord nickname",
      noPublishedFound: "No published dragons found.",
      unknownUser: "Unknown",
      rouletteDialogLabel: "Random dragon roulette",
      rouletteTitle: "Dragon roulette",
      dragonListDialogLabel: "Dragon list",
      chooseDragonModalTitle: "Choose your dragon",
      addingToWall: "Adding to the wall...",
      assignPreviewLabel: "Dragon preview before publish",
      chooseAnother: "Choose another",
      saving: "Saving...",
      uploading: "Uploading...",
      confirmChoice: "Confirm choice",
      uploadFailed: "Upload failed",
      fileTooLarge: "File too large (max 5 MB)",
      networkError: "Network error",
      networkOrServerError: "Network or server error",
      assignFailed: "Failed to place dragon",
      noFreeSlot: "Could not find free slot",
      shareButton: "Share",
      shareModalTitle: "Share Raiku Graffiti",
      shareTelegram: "Share on Telegram",
      shareTwitter: "Share on Twitter (X)",
      shareFacebook: "Share on Facebook",
      shareCopyLink: "Copy link",
      shareNative: "Share via your device",
      shareCopied: "Link copied",
      shareCopyFailed: "Unable to copy link",
      shareOpenFailed: "Unable to open sharing window",
    },
    notFound: {
      title: "Page not found",
      text: "This page does not exist.",
      home: "Back to home",
    },
  },
  ru: {
    siteTitle: "Raiku Graffiti",
    shareTitle: "Raiku Graffiti",
    shareDescription: "Leave your mark. Become part of the Raiku",
    header: {
      foreverInHeart: "В сердце Raiku навсегда",
      connectDiscord: "Подключить Discord",
      disconnectDiscord: "Отключить",
      about: "О проекте",
      close: "Закрыть",
      aboutCredit:
        "Полная разработка, структурирование, практическая адаптация, реализация проекта и дизайн стикеров были выполнены",
      aboutCreditRu:
        "Полная разработка, структурирование, практическая адаптация, реализация проекта и дизайн стикеров были выполнены",
      conceptCredit: "Проект основан на концептуальной идее, предложенной",
    },
    wall: {
      connectHint: "Подключите Discord",
      chooseDragon: "Выбрать дракона",
      chooseRandomDragon: "Случайный дракон",
      rouletteSpinning: "Рулетка крутится...",
      quickSearchTitle: "Быстрый поиск опубликованных драконов",
      quickSearchPlaceholder: "Поиск по Discord нику",
      noPublishedFound: "Опубликованные драконы не найдены.",
      unknownUser: "Неизвестно",
      rouletteDialogLabel: "Рулетка случайного дракона",
      rouletteTitle: "Рулетка драконов",
      dragonListDialogLabel: "Список драконов",
      chooseDragonModalTitle: "Выберите дракона",
      addingToWall: "Добавляем на стену...",
      assignPreviewLabel: "Предпросмотр дракона перед публикацией",
      chooseAnother: "Выбрать другого",
      saving: "Сохраняем...",
      uploading: "Загружаем...",
      confirmChoice: "Подтвердить выбор",
      uploadFailed: "Ошибка загрузки",
      fileTooLarge: "Файл слишком большой (макс. 5 МБ)",
      networkError: "Ошибка сети",
      networkOrServerError: "Ошибка сети или сервера",
      assignFailed: "Не удалось поставить дракона",
      noFreeSlot: "Не удалось найти свободный слот",
      shareButton: "Поделиться",
      shareModalTitle: "Поделиться Raiku Graffiti",
      shareTelegram: "Поделиться в Telegram",
      shareTwitter: "Поделиться в Twitter (X)",
      shareFacebook: "Поделиться в Facebook",
      shareCopyLink: "Копировать ссылку",
      shareNative: "Поделиться через устройство",
      shareCopied: "Ссылка скопирована",
      shareCopyFailed: "Не удалось скопировать ссылку",
      shareOpenFailed: "Не удалось открыть окно шаринга",
    },
    notFound: {
      title: "Страница не найдена",
      text: "Такой страницы нет.",
      home: "На главную",
    },
  },
};
