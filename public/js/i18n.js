const i18n = (function () {
  const STORAGE_KEY = 'picshare_lang';
  const DEFAULT_LANG = 'zh';

  // key 後綴 _one 表示 count === 1 時的單數形（中文不需要）
  const STRINGS = {
    zh: {
      'title.auth': '登入 / 註冊 | PicShare',
      'title.admin': '管理後台 | PicShare',
      'title.profile': '個人資料 | PicShare',
      'title.collections': '我的收藏 | PicShare',
      'title.changePassword': '修改密碼 | PicShare',
      'title.resetPassword': '重設密碼 | PicShare',
      'title.search': '搜尋 Unsplash 照片 | PicShare',
      'title.userPhotos': '使用者分享紀錄 | PicShare',

      'common.cancel': '取消',
      'common.share': '分享',
      'common.download': '下載',
      'common.search': '搜尋',
      'common.loading': '載入中...',
      'common.searching': '搜尋中...',
      'common.networkError': '連線錯誤，請確認伺服器是否啟動',
      'common.confirmDelete': '確認刪除',
      'common.listSeparator': '、',
      'common.photoAlt': '{name} 的照片',
      'common.createFailed': '建立失敗',
      'common.deleteFailed': '刪除失敗',
      'common.removeFailed': '移除失敗',
      'common.noPhotoMatch': '找不到符合條件的照片',
      'common.actions': '操作',

      'password.label': '密碼',
      'password.old': '舊密碼',
      'password.new': '新密碼',
      'password.confirm': '確認新密碼',
      'password.hint': '至少 8 碼，需同時包含英文字母與數字',
      'password.rule': '密碼至少 8 碼，需同時包含英文字母與數字',
      'password.newRule': '新密碼至少 8 碼，需同時包含英文字母與數字',
      'password.mismatch': '兩次輸入的新密碼不一致',
      'password.backToLogin': '返回登入',
      'user.nickname': '暱稱',

      'nav.share': '分享',
      'nav.findPhotos': '找圖片',
      'nav.login': '登入',
      'nav.register': '註冊',
      'nav.profile': '個人資料',
      'nav.collections': '我的收藏',
      'nav.mySharedPhotos': '我的分享紀錄',
      'nav.admin': '管理後台',
      'nav.logout': '登出',
      'nav.switchLang': '切換語言',
      'nav.switchLangAria': '切換語言',

      'footer.contact': '聯絡我們：',

      'share.title': '分享 Unsplash 照片',
      'share.urlPlaceholder': 'Unsplash 圖片網址，例如 https://unsplash.com/photos/xxxxx',
      'share.categoryLabel': '分類（至少一個）',
      'share.categoryPlaceholder': '輸入分類名稱，按 Enter 新增',
      'share.add': '新增',
      'share.removeCategory': '移除分類',
      'share.needCategory': '請至少選擇一個分類',
      'share.sharing': '分享中...',
      'share.success': '分享成功！',
      'share.failed': '分享失敗',

      'lightbox.title': '照片預覽',
      'lightbox.removeFromCollection': '移出收藏',
      'lightbox.sharedBy': '分享者：',
      'lightbox.collect': '收藏',

      'collect.title': '加入收藏庫',
      'collect.newLabel': '建立新收藏庫',
      'collect.newPlaceholder': '輸入收藏庫名稱',
      'collect.createAndAdd': '建立並加入',
      'collect.empty': '尚未建立任何收藏庫',
      'collect.adding': '加入中...',
      'collect.added': '已加入收藏庫！',
      'collect.duplicate': '這張照片已經在這個收藏庫了',
      'collect.addFailed': '加入失敗',
      'collect.creating': '建立中...',

      'home.searchPlaceholder': '搜尋本站分享的照片（攝影師或分類名稱）',
      'home.sortAria': '排序方式',
      'home.sortLatest': '最新',
      'home.sortPopular': '熱門',
      'home.allCategories': '全部',
      'home.empty': '目前尚無分享照片，敬請期待！',
      'home.unshare': '取消分享',
      'home.unshareConfirm': '確定要取消分享這張照片嗎？此動作無法復原。',
      'home.unsharing': '取消中...',
      'home.unshareFailed': '取消分享失敗',
      'home.savedByTitle': '{count} 人收藏，點擊收藏',
      'home.savedBy': '{count} 人收藏',

      'search.heading': '從 Unsplash 搜尋',
      'search.placeholder': '輸入關鍵字搜尋 Unsplash 圖片，例如 Long-tailed Tit',

      'auth.login': '登入',
      'auth.register': '註冊',
      'auth.noAccount': '還沒有帳號？',
      'auth.haveAccount': '已經有帳號了？',
      'auth.forgotLink': '忘記密碼？',
      'auth.forgotHeading': '忘記密碼',
      'auth.forgotHint': '我們會寄送重設密碼連結到此信箱',
      'auth.sendReset': '寄送重設密碼信',
      'auth.resetEmailSent': '若此 Email 已註冊，重設密碼信件已發送至您的信箱，請前往收信。',
      'auth.remembered': '想起密碼了？',
      'auth.invalidEmail': 'Email 格式不正確',
      'auth.passwordRequired': '密碼為必填',
      'auth.loggingIn': '登入中...',
      'auth.loginFailed': '登入失敗',
      'auth.nameRequired': '暱稱為必填',
      'auth.registering': '註冊中...',
      'auth.registerFailed': '註冊失敗',
      'auth.registerSuccess': '註冊成功',
      'auth.sending': '寄送中...',
      'auth.sendFailed': '寄送失敗，請稍後再試',

      'profile.heading': '個人資料',
      'profile.emailReadonly': 'Email 為唯讀欄位',
      'profile.nameEmpty': '暱稱不可為空',
      'profile.save': '儲存變更',
      'profile.changePassword': '修改密碼',
      'profile.dangerZone': '危險區域',
      'profile.deleteWarning': '刪除帳號後，你的所有分享、收藏庫、收藏紀錄將被永久刪除，此動作無法復原。',
      'profile.deleteAccount': '刪除帳號',
      'profile.confirmPassword': '請輸入密碼以確認',
      'profile.loadFailed': '載入個人資料失敗',
      'profile.saving': '儲存中...',
      'profile.saveFailed': '儲存失敗，請稍後再試',
      'profile.saved': '儲存成功',
      'profile.enterPassword': '請輸入密碼',
      'profile.deleteConfirm': '確定要刪除帳號嗎？此動作無法復原，所有分享、收藏庫、收藏紀錄都會被永久刪除。',
      'profile.deleteFailed': '刪除失敗，請稍後再試',
      'profile.deleted': '帳號已刪除，即將跳轉至首頁...',

      'changePassword.heading': '修改密碼',
      'changePassword.submit': '更新密碼',
      'changePassword.back': '返回個人資料',
      'changePassword.needOld': '請輸入舊密碼',
      'changePassword.updating': '更新中...',
      'changePassword.updateFailed': '更新失敗，請稍後再試',
      'changePassword.updateSuccess': '密碼更新成功',

      'resetPassword.heading': '重設密碼',
      'resetPassword.submit': '重設密碼',
      'resetPassword.invalidLink': '連結無效，請重新申請忘記密碼',
      'resetPassword.resetting': '重設中...',
      'resetPassword.resetFailed': '重設失敗，請重新申請忘記密碼',
      'resetPassword.successRedirect': '密碼重設成功，請重新登入，即將跳轉至登入頁...',

      'collections.heading': '我的收藏庫',
      'collections.new': '新增收藏庫',
      'common.breadcrumbHome': '首頁',
      'common.breadcrumbAria': '導覽路徑',
      'collections.delete': '刪除此收藏庫',
      'collections.deleteKeepsPhotos': '照片本身不會被刪除。',
      'collections.create': '建立',
      'collections.noPhotos': '尚無照片',
      'collections.photoCount': '{count} 張照片',
      'collections.emptyList': '尚未建立任何收藏庫，點擊右上角「新增收藏庫」開始收藏照片吧！',
      'collections.emptyCollection': '這個收藏庫還沒有照片',
      'collections.loadFailed': '載入收藏庫失敗',
      'collections.loadPhotosFailed': '載入照片失敗',
      'collections.removePhoto': '從收藏庫移除',
      'collections.removeConfirm': '確定要從這個收藏庫移除這張照片嗎？',
      'collections.deleteConfirm': '確定要刪除收藏庫「{name}」嗎？此動作無法復原。',

      'userPhotos.heading': '使用者分享紀錄',
      'userPhotos.own': '我的分享紀錄',
      'userPhotos.other': '{name} 的分享紀錄',
      'userPhotos.missingUserId': '缺少使用者 ID，無法載入分享紀錄',
      'userPhotos.ownEmpty': '你還沒有分享過任何照片',
      'userPhotos.otherEmpty': '這位使用者還沒有分享過任何照片',

      'admin.heading': '管理後台',
      'admin.tabsAria': '管理後台頁籤',
      'admin.tabUsers': '使用者管理',
      'admin.tabPhotos': '照片管理',
      'admin.usersKeyword': '搜尋暱稱',
      'admin.statusAll': '全部狀態',
      'admin.statusActive': '未停權',
      'admin.statusBanned': '已停權',
      'admin.colRole': '角色',
      'admin.colRegistered': '註冊時間',
      'admin.colStatus': '狀態',
      'admin.colPhoto': '照片',
      'admin.colCategories': '分類',
      'admin.colSharer': '分享者',
      'admin.colSharedAt': '分享時間',
      'admin.usersPaginationAria': '使用者分頁',
      'admin.photosPaginationAria': '照片分頁',
      'admin.photosKeyword': '搜尋攝影師或分類名稱',
      'admin.allCategories': '全部分類',
      'admin.exportCsv': '匯出刪除紀錄 CSV',
      'admin.badgeBanned': '已停權',
      'admin.badgeActive': '正常',
      'admin.ban': '停權',
      'admin.unban': '解除停權',
      'admin.paginationInfo': '顯示 {start} - {end} 筆，共 {total} 筆',
      'admin.loadUsersFailed': '載入使用者失敗',
      'admin.noUsers': '找不到符合條件的使用者',
      'admin.banConfirm': '確定要停權這位使用者嗎？停權後對方將無法登入使用本站。',
      'admin.banFailed': '停權失敗',
      'admin.unbanFailed': '解除停權失敗',
      'admin.banned': '已停權該使用者',
      'admin.unbanned': '已解除停權',
      'admin.loadPhotosFailed': '載入照片失敗',
      'admin.exportFailed': '匯出失敗',
      'admin.forceDelete': '強制刪除',
      'admin.forceDeleteTitle': '強制刪除照片',
      'admin.forceDeleteWarning': '此動作無法復原，將一併移除相關的分類與收藏紀錄。',
      'admin.forceDeleteReason': '刪除原因（選填）',
      'admin.forceDeleteReasonPlaceholder': '例如：版權檢舉、垃圾內容...',
      'admin.forceDeleteConfirm': '確定要強制刪除這張照片嗎？此動作無法復原，將一併移除相關的分類與收藏紀錄。',
      'admin.forceDeleteFailed': '強制刪除失敗',
      'admin.forceDeleted': '已強制刪除該照片'
    },
    en: {
      'title.auth': 'Log in / Sign up | PicShare',
      'title.admin': 'Admin Panel | PicShare',
      'title.profile': 'Profile | PicShare',
      'title.collections': 'My Collections | PicShare',
      'title.changePassword': 'Change Password | PicShare',
      'title.resetPassword': 'Reset Password | PicShare',
      'title.search': 'Search Unsplash Photos | PicShare',
      'title.userPhotos': 'Shared Photos | PicShare',

      'common.cancel': 'Cancel',
      'common.share': 'Share',
      'common.download': 'Download',
      'common.search': 'Search',
      'common.loading': 'Loading...',
      'common.searching': 'Searching...',
      'common.networkError': 'Connection error. Please make sure the server is running.',
      'common.confirmDelete': 'Confirm delete',
      'common.listSeparator': ', ',
      'common.photoAlt': 'Photo by {name}',
      'common.createFailed': 'Failed to create',
      'common.deleteFailed': 'Failed to delete',
      'common.removeFailed': 'Failed to remove',
      'common.noPhotoMatch': 'No photos match your search',
      'common.actions': 'Actions',

      'password.label': 'Password',
      'password.old': 'Current password',
      'password.new': 'New password',
      'password.confirm': 'Confirm new password',
      'password.hint': 'At least 8 characters, including both letters and numbers',
      'password.rule': 'Password must be at least 8 characters and include both letters and numbers',
      'password.newRule': 'New password must be at least 8 characters and include both letters and numbers',
      'password.mismatch': "The new passwords don't match",
      'password.backToLogin': 'Back to log in',
      'user.nickname': 'Nickname',

      'nav.share': 'Share',
      'nav.findPhotos': 'Find photos',
      'nav.login': 'Log in',
      'nav.register': 'Sign up',
      'nav.profile': 'Profile',
      'nav.collections': 'My collections',
      'nav.mySharedPhotos': 'My shared photos',
      'nav.admin': 'Admin panel',
      'nav.logout': 'Log out',
      'nav.switchLang': 'Language',
      'nav.switchLangAria': 'Switch language',

      'footer.contact': 'Contact us: ',

      'share.title': 'Share an Unsplash photo',
      'share.urlPlaceholder': 'Unsplash photo URL, e.g. https://unsplash.com/photos/xxxxx',
      'share.categoryLabel': 'Categories (at least one)',
      'share.categoryPlaceholder': 'Enter a category name, press Enter to add',
      'share.add': 'Add',
      'share.removeCategory': 'Remove category',
      'share.needCategory': 'Please add at least one category',
      'share.sharing': 'Sharing...',
      'share.success': 'Shared successfully!',
      'share.failed': 'Failed to share',

      'lightbox.title': 'Photo preview',
      'lightbox.removeFromCollection': 'Remove from collection',
      'lightbox.sharedBy': 'Shared by: ',
      'lightbox.collect': 'Save',

      'collect.title': 'Add to collection',
      'collect.newLabel': 'Create a new collection',
      'collect.newPlaceholder': 'Enter a collection name',
      'collect.createAndAdd': 'Create and add',
      'collect.empty': "You haven't created any collections yet",
      'collect.adding': 'Adding...',
      'collect.added': 'Added to collection!',
      'collect.duplicate': 'This photo is already in this collection',
      'collect.addFailed': 'Failed to add',
      'collect.creating': 'Creating...',

      'home.searchPlaceholder': 'Search shared photos (photographer or category)',
      'home.sortAria': 'Sort by',
      'home.sortLatest': 'Latest',
      'home.sortPopular': 'Popular',
      'home.allCategories': 'All',
      'home.empty': 'No shared photos yet. Stay tuned!',
      'home.unshare': 'Unshare',
      'home.unshareConfirm': "Are you sure you want to unshare this photo? This can't be undone.",
      'home.unsharing': 'Unsharing...',
      'home.unshareFailed': 'Failed to unshare',
      'home.savedByTitle': 'Saved by {count} people. Click to save.',
      'home.savedByTitle_one': 'Saved by 1 person. Click to save.',
      'home.savedBy': 'Saved by {count} people',
      'home.savedBy_one': 'Saved by 1 person',

      'search.heading': 'Search Unsplash',
      'search.placeholder': 'Enter keywords to search Unsplash photos, e.g. Long-tailed Tit',

      'auth.login': 'Log in',
      'auth.register': 'Sign up',
      'auth.noAccount': "Don't have an account? ",
      'auth.haveAccount': 'Already have an account? ',
      'auth.forgotLink': 'Forgot password?',
      'auth.forgotHeading': 'Forgot password',
      'auth.forgotHint': "We'll send a password reset link to this email",
      'auth.sendReset': 'Send reset email',
      'auth.resetEmailSent': 'If this email is registered, a password reset link has been sent. Please check your inbox.',
      'auth.remembered': 'Remembered your password? ',
      'auth.invalidEmail': 'Invalid email format',
      'auth.passwordRequired': 'Password is required',
      'auth.loggingIn': 'Logging in...',
      'auth.loginFailed': 'Login failed',
      'auth.nameRequired': 'Nickname is required',
      'auth.registering': 'Signing up...',
      'auth.registerFailed': 'Sign-up failed',
      'auth.registerSuccess': 'Account created successfully',
      'auth.sending': 'Sending...',
      'auth.sendFailed': 'Failed to send. Please try again later.',

      'profile.heading': 'Profile',
      'profile.emailReadonly': 'Email is read-only',
      'profile.nameEmpty': "Nickname can't be empty",
      'profile.save': 'Save changes',
      'profile.changePassword': 'Change password',
      'profile.dangerZone': 'Danger zone',
      'profile.deleteWarning': "Once you delete your account, all your shared photos, collections, and saved items will be permanently deleted. This can't be undone.",
      'profile.deleteAccount': 'Delete account',
      'profile.confirmPassword': 'Enter your password to confirm',
      'profile.loadFailed': 'Failed to load profile',
      'profile.saving': 'Saving...',
      'profile.saveFailed': 'Failed to save. Please try again later.',
      'profile.saved': 'Saved successfully',
      'profile.enterPassword': 'Please enter your password',
      'profile.deleteConfirm': "Are you sure you want to delete your account? This can't be undone, and all your shared photos, collections, and saved items will be permanently deleted.",
      'profile.deleteFailed': 'Failed to delete. Please try again later.',
      'profile.deleted': 'Account deleted. Redirecting to the home page...',

      'changePassword.heading': 'Change password',
      'changePassword.submit': 'Update password',
      'changePassword.back': 'Back to profile',
      'changePassword.needOld': 'Please enter your current password',
      'changePassword.updating': 'Updating...',
      'changePassword.updateFailed': 'Failed to update. Please try again later.',
      'changePassword.updateSuccess': 'Password updated successfully',

      'resetPassword.heading': 'Reset password',
      'resetPassword.submit': 'Reset password',
      'resetPassword.invalidLink': 'Invalid link. Please request a new password reset.',
      'resetPassword.resetting': 'Resetting...',
      'resetPassword.resetFailed': 'Reset failed. Please request a new password reset.',
      'resetPassword.successRedirect': 'Password reset successfully. Redirecting to the login page...',

      'collections.heading': 'My collections',
      'collections.new': 'New collection',
      'common.breadcrumbHome': 'Home',
      'common.breadcrumbAria': 'Breadcrumb',
      'collections.delete': 'Delete this collection',
      'collections.deleteKeepsPhotos': "The photos themselves won't be deleted.",
      'collections.create': 'Create',
      'collections.noPhotos': 'No photos yet',
      'collections.photoCount': '{count} photos',
      'collections.photoCount_one': '1 photo',
      'collections.emptyList': 'You haven\'t created any collections yet. Click "New collection" in the top right to start saving photos!',
      'collections.emptyCollection': 'This collection has no photos yet',
      'collections.loadFailed': 'Failed to load collections',
      'collections.loadPhotosFailed': 'Failed to load photos',
      'collections.removePhoto': 'Remove from collection',
      'collections.removeConfirm': 'Are you sure you want to remove this photo from the collection?',
      'collections.deleteConfirm': 'Are you sure you want to delete the collection "{name}"? This can\'t be undone.',

      'userPhotos.heading': 'Shared photos',
      'userPhotos.own': 'My shared photos',
      'userPhotos.other': "{name}'s shared photos",
      'userPhotos.missingUserId': "Missing user ID. Can't load shared photos.",
      'userPhotos.ownEmpty': "You haven't shared any photos yet",
      'userPhotos.otherEmpty': "This user hasn't shared any photos yet",

      'admin.heading': 'Admin panel',
      'admin.tabsAria': 'Admin panel tabs',
      'admin.tabUsers': 'Users',
      'admin.tabPhotos': 'Photos',
      'admin.usersKeyword': 'Search by nickname',
      'admin.statusAll': 'All statuses',
      'admin.statusActive': 'Active',
      'admin.statusBanned': 'Banned',
      'admin.colRole': 'Role',
      'admin.colRegistered': 'Registered',
      'admin.colStatus': 'Status',
      'admin.colPhoto': 'Photo',
      'admin.colCategories': 'Categories',
      'admin.colSharer': 'Shared by',
      'admin.colSharedAt': 'Shared on',
      'admin.usersPaginationAria': 'Users pagination',
      'admin.photosPaginationAria': 'Photos pagination',
      'admin.photosKeyword': 'Search by photographer or category',
      'admin.allCategories': 'All categories',
      'admin.exportCsv': 'Export deletion log (CSV)',
      'admin.badgeBanned': 'Banned',
      'admin.badgeActive': 'Active',
      'admin.ban': 'Ban',
      'admin.unban': 'Unban',
      'admin.paginationInfo': 'Showing {start} - {end} of {total}',
      'admin.loadUsersFailed': 'Failed to load users',
      'admin.noUsers': 'No users match your search',
      'admin.banConfirm': 'Are you sure you want to ban this user? They will no longer be able to log in.',
      'admin.banFailed': 'Failed to ban',
      'admin.unbanFailed': 'Failed to unban',
      'admin.banned': 'User banned',
      'admin.unbanned': 'User unbanned',
      'admin.loadPhotosFailed': 'Failed to load photos',
      'admin.exportFailed': 'Failed to export',
      'admin.forceDelete': 'Force delete',
      'admin.forceDeleteTitle': 'Force delete photo',
      'admin.forceDeleteWarning': "This can't be undone. Related categories and saved records will also be removed.",
      'admin.forceDeleteReason': 'Reason for deletion (optional)',
      'admin.forceDeleteReasonPlaceholder': 'e.g. copyright infringement, spam...',
      'admin.forceDeleteConfirm': "Are you sure you want to force delete this photo? This can't be undone. Related categories and saved records will also be removed.",
      'admin.forceDeleteFailed': 'Failed to force delete',
      'admin.forceDeleted': 'Photo force-deleted'
    }
  };

  const LANGUAGES = [
    { code: 'zh', label: '繁體中文' },
    { code: 'en', label: 'English' }
  ];

  const HTML_LANG_MAP = { zh: 'zh-Hant', en: 'en' };

  const DATE_FORMATS = {
    zh: { locale: 'zh-Hant', options: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    en: { locale: 'en-US', options: { year: 'numeric', month: 'short', day: 'numeric' } }
  };

  function isValidLang(code) {
    return LANGUAGES.some((l) => l.code === code);
  }

  function htmlLangFor(lang) {
    return HTML_LANG_MAP[lang] || lang;
  }

  function detectBrowserLang() {
    const candidates = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (const raw of candidates) {
      if (!raw) continue;
      const primary = raw.toLowerCase().split('-')[0];
      if (isValidLang(primary)) return primary;
    }

    return 'en';
  }

  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidLang(stored) ? stored : detectBrowserLang();
  }

  function t(key, vars) {
    const dict = STRINGS[getLang()];
    const pluralStr = vars && vars.count === 1 ? dict[`${key}_one`] : undefined;
    let str = pluralStr ?? dict[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;

    if (vars) {
      Object.keys(vars).forEach((name) => {
        str = str.replace(new RegExp(`\\{${name}\\}`, 'g'), () => String(vars[name]));
      });
    }

    return str;
  }

  function formatDate(isoString) {
    const { locale, options } = DATE_FORMATS[getLang()];
    return new Date(isoString).toLocaleDateString(locale, options);
  }

  function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  const CHECK_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="flex-shrink-0" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/></svg>';

  function renderLangControls() {
    const lang = getLang();

    document.querySelectorAll('[data-lang-list]').forEach((menu) => {
      menu.innerHTML = '';
      LANGUAGES.forEach((item) => {
        const isCurrent = item.code === lang;
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dropdown-item lang-submenu-item d-flex align-items-center justify-content-between gap-3';
        btn.classList.toggle('is-current', isCurrent);
        if (isCurrent) btn.setAttribute('aria-current', 'true');
        btn.setAttribute('data-lang-option', item.code);
        btn.lang = htmlLangFor(item.code);

        const label = document.createElement('span');
        label.textContent = item.label;
        btn.appendChild(label);
        if (isCurrent) btn.insertAdjacentHTML('beforeend', CHECK_ICON);

        btn.addEventListener('click', () => {
          if (!isCurrent) setLang(item.code);
        });
        li.appendChild(btn);
        menu.appendChild(li);
      });
    });

    document.querySelectorAll('[data-lang-submenu-toggle]').forEach((toggle) => {
      if (toggle.dataset.wired) return;
      toggle.dataset.wired = 'true';
      toggle.addEventListener('click', (event) => {
        // 擋掉冒泡，避免 Bootstrap 把整個使用者選單一起關掉
        event.stopPropagation();
        const submenu = toggle.parentElement.querySelector('.lang-submenu');
        toggle.setAttribute('aria-expanded', String(submenu.classList.toggle('show')));
      });
    });
  }

  function setLang(lang) {
    const normalized = isValidLang(lang) ? lang : DEFAULT_LANG;
    localStorage.setItem(STORAGE_KEY, normalized);
    document.documentElement.lang = htmlLangFor(normalized);
    applyI18n();
    renderLangControls();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: getLang() } }));
  }

  document.documentElement.lang = htmlLangFor(getLang());
  applyI18n();
  renderLangControls();

  // 使用者選單關閉時，一併收起語言子選單
  document.addEventListener('hide.bs.dropdown', () => {
    document.querySelectorAll('.lang-submenu.show').forEach((menu) => {
      menu.classList.remove('show');
      menu.parentElement.querySelector('[data-lang-submenu-toggle]').setAttribute('aria-expanded', 'false');
    });
  });

  return { getLang, setLang, t, formatDate, applyI18n, renderLangControls };
})();
