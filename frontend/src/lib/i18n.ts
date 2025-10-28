// Internationalization system for MuscleRise
export type Language = 'en' | 'uz' | 'ru';

export interface Translations {
    // Navigation
    nav: {
        home: string;
        stats: string;
        settings: string;
        shop: string;
        top: string;
        logout: string;
    };

    // Common
    common: {
        loading: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        add: string;
        complete: string;
        completed: string;
        today: string;
        yesterday: string;
        coins: string;
        calories: string;
        exercises: string;
        workouts: string;
        rank: string;
        plan: string;
        level: string;
        reps: string;
        targetReps: string;
        completedReps: string;
        caloriesPerRep: string;
    };

    // Home page
    home: {
        title: string;
        todaysRank: string;
        improveRank: string;
        todaysWorkouts: string;
        todaysStats: string;
        mainMenu: string;
        menuItems: {
            workouts: {
                title: string;
                desc: string;
            };
            stats: {
                title: string;
                desc: string;
            };
            settings: {
                title: string;
                desc: string;
            };
            topUsers: {
                title: string;
                desc: string;
            };
        };
    };

    // Stats page
    stats: {
        title: string;
        daily: string;
        weekly: string;
        monthly: string;
        yearly: string;
        todaysResults: string;
        yesterdaysResults: string;
        caloriesBurned: string;
        exercisesCompleted: string;
        caloriesPerExercise: string;
        noWorkoutData: string;
        noWorkoutDataToday: string;
        noWorkoutDataYesterday: string;
    };

    // Settings page
    settings: {
        title: string;
        profile: string;
        name: string;
        weight: string;
        height: string;
        avatar: string;
        avatarUrl: string;
        updateAvatar: string;
        workoutPlan: string;
        selectPlan: string;
        language: string;
        selectLanguage: string;
        customExercises: string;
        addExercise: string;
        exerciseName: string;
        exerciseReps: string;
        saveCustomPlan: string;
        deleteExercise: string;
        kg: string;
        cm: string;
    };

    // Shop page
    shop: {
        title: string;
        themes: string;
        primaryColors: string;
        colorPicker: string;
        purchase: string;
        owned: string;
        apply: string;
        active: string;
        free: string;
        notEnoughCoins: string;
        purchaseSuccess: string;
        applySuccess: string;
        costCoinsEachTime: string;
        darkTheme: string;
        emeraldTheme: string;
        skyTheme: string;
        whiteTheme: string;
        backgroundGradient: string;
        forestTheme: string;
        emeraldColor: string;
        skyColor: string;
        pinkColor: string;
        yellowColor: string;
        whiteColor: string;
        selectedColor: string;
        sampleText: string;
        howTextWillLook: string;
        customPrimaryColor: string;
        chooseTextColor: string;
        preview: string;
    };

    // Top Users page
    top: {
        title: string;
        leaderboard: string;
        position: string;
        username: string;
        totalCoins: string;
        streak: string;
        totalWorkouts: string;
        totalExercises: string;
        totalCalories: string;
        averageCaloriesPerDay: string;
        dayStreak: string;
        lastWorkout: string;
        userStatistics: string;
        loadingStatistics: string;
        failedToLoadStats: string;
        close: string;
        viewStats: string;
        noUsers: string;
    };

    // Auth
    auth: {
        login: string;
        register: string;
        username: string;
        password: string;
        confirmPassword: string;
        loginButton: string;
        registerButton: string;
        switchToRegister: string;
        switchToLogin: string;
        loginSuccess: string;
        registerSuccess: string;
        loginError: string;
        registerError: string;
        logoutSuccess: string;
    };

    // Onboarding
    onboarding: {
        welcome: string;
        getStarted: string;
        setupProfile: string;
        enterDetails: string;
        selectWorkoutPlan: string;
        choosePlan: string;
        beginner: string;
        middle: string;
        hardcore: string;
        custom: string;
        finish: string;
        skip: string;
    };

    // Exercise names
    exercises: {
        pushups: string;
        squats: string;
        plank: string;
        wallSits: string;
        legRaises: string;
        lunges: string;
        mountainClimbers: string;
        jumpingJacks: string;
        russianTwists: string;
        burpees: string;
        diamondPushups: string;
        jumpSquats: string;
        pikePushups: string;
        bearCrawls: string;
        singleLegGluteBridge: string;
        bicycleCrunches: string;
        highKnees: string;
    };

    // Workout plans
    plans: {
        beginner: string;
        middle: string;
        hardcore: string;
        custom: string;
    };

    // Messages
    messages: {
        exerciseCompleted: string;
        exerciseAlreadyCompleted: string;
        workoutSaved: string;
        profileUpdated: string;
        settingsSaved: string;
        error: string;
        success: string;
    };
}

// English translations
const en: Translations = {
    nav: {
        home: 'Home',
        stats: 'Stats',
        settings: 'Settings',
        shop: 'Shop',
        top: 'Top',
        logout: 'Logout'
    },
    common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        complete: 'Complete',
        completed: 'Completed',
        today: 'Today',
        yesterday: 'Yesterday',
        coins: 'Coins',
        calories: 'Calories',
        exercises: 'Exercises',
        workouts: 'Workouts',
        rank: 'Rank',
        plan: 'Plan',
        level: 'Level',
        reps: 'Reps',
        targetReps: 'Target Reps',
        completedReps: 'Completed Reps',
        caloriesPerRep: 'kcal/rep'
    },
    home: {
        title: 'MuscleRise',
        todaysRank: "Today's rank",
        improveRank: 'Improve your rank by completing workouts',
        todaysWorkouts: "Today's Workouts",
        todaysStats: "Today's stats",
        mainMenu: 'Main menu',
        menuItems: {
            workouts: {
                title: 'Workouts',
                desc: "Today's workout list"
            },
            stats: {
                title: 'Stats',
                desc: 'Daily, weekly, monthly, yearly charts'
            },
            settings: {
                title: 'Settings',
                desc: 'Customize your profile and preferences'
            },
            topUsers: {
                title: 'Top Users',
                desc: 'See where you stand among others'
            }
        }
    },
    stats: {
        title: 'Statistics',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
        todaysResults: "Today's Results",
        yesterdaysResults: "Yesterday's Results",
        caloriesBurned: 'Calories Burned',
        exercisesCompleted: 'Exercises Completed',
        caloriesPerExercise: 'Calories per exercise',
        noWorkoutData: 'No workout data',
        noWorkoutDataToday: 'No workout data for today',
        noWorkoutDataYesterday: 'No workout data for yesterday'
    },
    settings: {
        title: 'Settings',
        profile: 'Profile',
        name: 'Name',
        weight: 'Weight',
        height: 'Height',
        avatar: 'Avatar',
        avatarUrl: 'Avatar URL',
        updateAvatar: 'Update Avatar',
        workoutPlan: 'Workout Plan',
        selectPlan: 'Select Plan',
        language: 'Language',
        selectLanguage: 'Select Language',
        customExercises: 'Custom Exercises',
        addExercise: 'Add Exercise',
        exerciseName: 'Exercise Name',
        exerciseReps: 'Reps',
        saveCustomPlan: 'Save Custom Plan',
        deleteExercise: 'Delete Exercise',
        kg: 'kg',
        cm: 'cm'
    },
    shop: {
        title: 'Shop',
        themes: 'Themes',
        primaryColors: 'Primary Colors',
        colorPicker: 'Color Picker',
        purchase: 'Purchase',
        owned: 'Owned',
        apply: 'Apply',
        active: 'Active',
        free: 'Free',
        notEnoughCoins: 'Not enough coins',
        purchaseSuccess: 'Purchase successful',
        applySuccess: 'Theme applied successfully',
        costCoinsEachTime: 'cost 100 coins each time',
        darkTheme: 'Dark Theme',
        emeraldTheme: 'Emerald Theme',
        skyTheme: 'Sky Theme',
        whiteTheme: 'White Theme',
        backgroundGradient: 'Background Gradient',
        forestTheme: 'Forest Theme',
        emeraldColor: 'Emerald',
        skyColor: 'Sky',
        pinkColor: 'Pink',
        yellowColor: 'Yellow',
        whiteColor: 'White',
        selectedColor: 'Selected Color:',
        sampleText: 'Sample Text',
        howTextWillLook: 'This is how your text will look',
        customPrimaryColor: 'Custom Primary Color',
        chooseTextColor: 'Choose your text color',
        preview: 'Preview:'
    },
    top: {
        title: 'Top Users',
        leaderboard: 'Leaderboard',
        position: 'Position',
        username: 'Username',
        totalCoins: 'Total Coins',
        streak: 'Streak',
        totalWorkouts: 'Total Workouts',
        totalExercises: 'Total Exercises',
        totalCalories: 'Total Calories',
        averageCaloriesPerDay: 'Average Calories per Day',
        dayStreak: 'Day Streak',
        lastWorkout: 'Last Workout',
        userStatistics: 'User Statistics',
        loadingStatistics: 'Loading statistics...',
        failedToLoadStats: 'Failed to load statistics',
        close: 'Close',
        viewStats: 'View stats',
        noUsers: 'No users found'
    },
    auth: {
        login: 'Login',
        register: 'Register',
        username: 'Username',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        loginButton: 'Login',
        registerButton: 'Register',
        switchToRegister: "Don't have an account? Register",
        switchToLogin: 'Already have an account? Login',
        loginSuccess: 'Login successful',
        registerSuccess: 'Registration successful',
        loginError: 'Login failed',
        registerError: 'Registration failed',
        logoutSuccess: 'Logout successful'
    },
    onboarding: {
        welcome: 'Welcome to MuscleRise',
        getStarted: 'Get Started',
        setupProfile: 'Setup Profile',
        enterDetails: 'Enter your details',
        selectWorkoutPlan: 'Select Workout Plan',
        choosePlan: 'Choose your workout plan',
        beginner: 'Beginner',
        middle: 'Middle',
        hardcore: 'Hardcore',
        custom: 'Custom',
        finish: 'Finish',
        skip: 'Skip'
    },
    exercises: {
        pushups: 'Push-ups',
        squats: 'Squats',
        plank: 'Plank (sec)',
        wallSits: 'Wall Sits (sec)',
        legRaises: 'Leg Raises',
        lunges: 'Lunges',
        mountainClimbers: 'Mountain Climbers',
        jumpingJacks: 'Jumping Jacks',
        russianTwists: 'Russian Twists',
        burpees: 'Burpees',
        diamondPushups: 'Diamond Push-ups',
        jumpSquats: 'Jump Squats',
        pikePushups: 'Pike Push-ups',
        bearCrawls: 'Bear Crawls',
        singleLegGluteBridge: 'Single Leg Glute Bridge',
        bicycleCrunches: 'Bicycle Crunches',
        highKnees: 'High Knees'
    },
    plans: {
        beginner: 'Beginner Level',
        middle: 'Middle Level',
        hardcore: 'Hardcore Level',
        custom: 'Custom Plan'
    },
    messages: {
        exerciseCompleted: 'Exercise completed successfully',
        exerciseAlreadyCompleted: 'Exercise already completed for today',
        workoutSaved: 'Workout saved successfully',
        profileUpdated: 'Profile updated successfully',
        settingsSaved: 'Settings saved successfully',
        error: 'An error occurred',
        success: 'Success'
    }
};

// Uzbek translations
const uz: Translations = {
    nav: {
        home: 'Bosh sahifa',
        stats: 'Statistika',
        settings: 'Sozlamalar',
        shop: 'Do\'kon',
        top: 'Reyting',
        logout: 'Chiqish'
    },
    common: {
        loading: 'Yuklanmoqda...',
        save: 'Saqlash',
        cancel: 'Bekor qilish',
        delete: 'O\'chirish',
        edit: 'Tahrirlash',
        add: 'Qo\'shish',
        complete: 'Bajarish',
        completed: 'Bajarildi',
        today: 'Bugun',
        yesterday: 'Kecha',
        coins: 'Tangalar',
        calories: 'Kaloriyalar',
        exercises: 'Mashqlar',
        workouts: 'Mashg\'ulotlar',
        rank: 'Reyting',
        plan: 'Reja',
        level: 'Daraja',
        reps: 'Takror',
        targetReps: 'Maqsadli takror',
        completedReps: 'Bajarilgan takror',
        caloriesPerRep: 'kkal/takror'
    },
    home: {
        title: 'MuscleRise',
        todaysRank: 'Bugungi reyting',
        improveRank: 'Mashg\'ulotlarni bajarib reytingingizni yaxshilang',
        todaysWorkouts: 'Bugungi mashqlar',
        todaysStats: 'Bugungi statistika',
        mainMenu: 'Asosiy menyu',
        menuItems: {
            workouts: {
                title: 'Mashqlar',
                desc: 'Bugungi mashqlar ro\'yxati'
            },
            stats: {
                title: 'Statistika',
                desc: 'Kunlik, haftalik, oylik, yillik diagrammalar'
            },
            settings: {
                title: 'Sozlamalar',
                desc: 'Profilingiz va sozlamalaringizni o\'zgartiring'
            },
            topUsers: {
                title: 'Top foydalanuvchilar',
                desc: 'Boshqalar orasida o\'rningizni ko\'ring'
            }
        }
    },
    stats: {
        title: 'Statistika',
        daily: 'Kunlik',
        weekly: 'Haftalik',
        monthly: 'Oylik',
        yearly: 'Yillik',
        todaysResults: 'Bugungi natijalar',
        yesterdaysResults: 'Kechagi natijalar',
        caloriesBurned: 'Yoqilgan kaloriyalar',
        exercisesCompleted: 'Bajarilgan mashqlar',
        caloriesPerExercise: 'Har bir mashq uchun kaloriya',
        noWorkoutData: 'Mashg\'ulot ma\'lumotlari yo\'q',
        noWorkoutDataToday: 'Bugun uchun mashg\'ulot ma\'lumotlari yo\'q',
        noWorkoutDataYesterday: 'Kecha uchun mashg\'ulot ma\'lumotlari yo\'q'
    },
    settings: {
        title: 'Sozlamalar',
        profile: 'Profil',
        name: 'Ism',
        weight: 'Vazn',
        height: 'Bo\'y',
        avatar: 'Avatar',
        avatarUrl: 'Avatar URL',
        updateAvatar: 'Avatarni yangilash',
        workoutPlan: 'Mashg\'ulot rejasi',
        selectPlan: 'Rejani tanlang',
        language: 'Til',
        selectLanguage: 'Tilni tanlang',
        customExercises: 'Maxsus mashqlar',
        addExercise: 'Mashq qo\'shish',
        exerciseName: 'Mashq nomi',
        exerciseReps: 'Takrorlar soni',
        saveCustomPlan: 'Maxsus rejani saqlash',
        deleteExercise: 'Mashqni o\'chirish',
        kg: 'kg',
        cm: 'sm'
    },
    shop: {
        title: 'Do\'kon',
        themes: 'Mavzular',
        primaryColors: 'Asosiy ranglar',
        colorPicker: 'Rang tanlash',
        purchase: 'Sotib olish',
        owned: 'Egalik qiladi',
        apply: 'Qo\'llash',
        active: 'Faol',
        free: 'Bepul',
        notEnoughCoins: 'Tangalar yetarli emas',
        purchaseSuccess: 'Muvaffaqiyatli sotib olindi',
        applySuccess: 'Mavzu muvaffaqiyatli qo\'llandi',
        costCoinsEachTime: 'har safar 100 tanga',
        darkTheme: 'Qorong\'u mavzu',
        emeraldTheme: 'Zumrad mavzu',
        skyTheme: 'Osmon mavzu',
        whiteTheme: 'Oq mavzu',
        backgroundGradient: 'Orqa fon gradienti',
        forestTheme: 'O\'rmon mavzu',
        emeraldColor: 'Zumrad',
        skyColor: 'Osmon',
        pinkColor: 'Pushti',
        yellowColor: 'Sariq',
        whiteColor: 'Oq',
        selectedColor: 'Tanlangan rang:',
        sampleText: 'Namuna matn',
        howTextWillLook: 'Matn shunday ko\'rinadi',
        customPrimaryColor: 'Maxsus asosiy rang',
        chooseTextColor: 'Matn rangini tanlang',
        preview: 'Ko\'rish:'
    },
    top: {
        title: 'Top foydalanuvchilar',
        leaderboard: 'Reyting jadvali',
        position: 'O\'rin',
        username: 'Foydalanuvchi nomi',
        totalCoins: 'Jami tangalar',
        streak: 'Ketma-ketlik',
        totalWorkouts: 'Jami mashg\'ulotlar',
        totalExercises: 'Jami mashqlar',
        totalCalories: 'Jami kaloriyalar',
        averageCaloriesPerDay: 'Kunlik o\'rtacha kaloriya',
        dayStreak: 'Kunlik ketma-ketlik',
        lastWorkout: 'Oxirgi mashg\'ulot',
        userStatistics: 'Foydalanuvchi statistikasi',
        loadingStatistics: 'Statistika yuklanmoqda...',
        failedToLoadStats: 'Statistikani yuklashda xatolik',
        close: 'Yopish',
        viewStats: 'Statistikani ko\'rish',
        noUsers: 'Foydalanuvchilar topilmadi'
    },
    auth: {
        login: 'Kirish',
        register: 'Ro\'yxatdan o\'tish',
        username: 'Foydalanuvchi nomi',
        password: 'Parol',
        confirmPassword: 'Parolni tasdiqlang',
        loginButton: 'Kirish',
        registerButton: 'Ro\'yxatdan o\'tish',
        switchToRegister: 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting',
        switchToLogin: 'Hisobingiz bormi? Kiring',
        loginSuccess: 'Muvaffaqiyatli kirildi',
        registerSuccess: 'Muvaffaqiyatli ro\'yxatdan o\'tildi',
        loginError: 'Kirishda xatolik',
        registerError: 'Ro\'yxatdan o\'tishda xatolik',
        logoutSuccess: 'Muvaffaqiyatli chiqildi'
    },
    onboarding: {
        welcome: 'MuscleRise ga xush kelibsiz',
        getStarted: 'Boshlash',
        setupProfile: 'Profilni sozlash',
        enterDetails: 'Ma\'lumotlaringizni kiriting',
        selectWorkoutPlan: 'Mashg\'ulot rejasini tanlang',
        choosePlan: 'Mashg\'ulot rejangizni tanlang',
        beginner: 'Boshlang\'ich',
        middle: 'O\'rta',
        hardcore: 'Qattiq',
        custom: 'Maxsus',
        finish: 'Tugatish',
        skip: 'O\'tkazib yuborish'
    },
    exercises: {
        pushups: 'Brustdan itarish',
        squats: 'Cho\'kkalab turish',
        plank: 'Planka (soniya)',
        wallSits: 'Devorga suyanib o\'tirish (soniya)',
        legRaises: 'Oyoqlarni ko\'tarish',
        lunges: 'Oldinga qadam',
        mountainClimbers: 'Tog\' chiquvchi',
        jumpingJacks: 'Sakrab yoyilish',
        russianTwists: 'Rus burilishi',
        burpees: 'Berpi',
        diamondPushups: 'Olmos itarish',
        jumpSquats: 'Sakrab cho\'kkalab turish',
        pikePushups: 'Nayzali itarish',
        bearCrawls: 'Ayiq yurishi',
        singleLegGluteBridge: 'Bir oyoqli ko\'prik',
        bicycleCrunches: 'Velosiped harakati',
        highKnees: 'Yuqori tizzalar'
    },
    plans: {
        beginner: 'Boshlang\'ich daraja',
        middle: 'O\'rta daraja',
        hardcore: 'Qattiq daraja',
        custom: 'Maxsus reja'
    },
    messages: {
        exerciseCompleted: 'Mashq muvaffaqiyatli bajarildi',
        exerciseAlreadyCompleted: 'Mashq bugun allaqachon bajarilgan',
        workoutSaved: 'Mashg\'ulot muvaffaqiyatli saqlandi',
        profileUpdated: 'Profil muvaffaqiyatli yangilandi',
        settingsSaved: 'Sozlamalar muvaffaqiyatli saqlandi',
        error: 'Xatolik yuz berdi',
        success: 'Muvaffaq'
    }
};

// Russian translations
const ru: Translations = {
    nav: {
        home: 'Главная',
        stats: 'Статистика',
        settings: 'Настройки',
        shop: 'Магазин',
        top: 'Рейтинг',
        logout: 'Выход'
    },
    common: {
        loading: 'Загрузка...',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        add: 'Добавить',
        complete: 'Выполнить',
        completed: 'Выполнено',
        today: 'Сегодня',
        yesterday: 'Вчера',
        coins: 'Монеты',
        calories: 'Калории',
        exercises: 'Упражнения',
        workouts: 'Тренировки',
        rank: 'Рейтинг',
        plan: 'План',
        level: 'Уровень',
        reps: 'Повторы',
        targetReps: 'Целевые повторы',
        completedReps: 'Выполненные повторы',
        caloriesPerRep: 'ккал/повтор'
    },
    home: {
        title: 'MuscleRise',
        todaysRank: 'Сегодняшний рейтинг',
        improveRank: 'Улучшите свой рейтинг, выполняя тренировки',
        todaysWorkouts: 'Сегодняшние упражнения',
        todaysStats: 'Сегодняшняя статистика',
        mainMenu: 'Главное меню',
        menuItems: {
            workouts: {
                title: 'Упражнения',
                desc: 'Список сегодняшних упражнений'
            },
            stats: {
                title: 'Статистика',
                desc: 'Ежедневные, еженедельные, ежемесячные, годовые графики'
            },
            settings: {
                title: 'Настройки',
                desc: 'Настройте свой профиль и предпочтения'
            },
            topUsers: {
                title: 'Топ пользователей',
                desc: 'Посмотрите, где вы находитесь среди других'
            }
        }
    },
    stats: {
        title: 'Статистика',
        daily: 'Ежедневно',
        weekly: 'Еженедельно',
        monthly: 'Ежемесячно',
        yearly: 'Ежегодно',
        todaysResults: 'Сегодняшние результаты',
        yesterdaysResults: 'Вчерашние результаты',
        caloriesBurned: 'Сожжено калорий',
        exercisesCompleted: 'Выполнено упражнений',
        caloriesPerExercise: 'Калории за упражнение',
        noWorkoutData: 'Нет данных о тренировках',
        noWorkoutDataToday: 'Нет данных о тренировках на сегодня',
        noWorkoutDataYesterday: 'Нет данных о тренировках на вчера'
    },
    settings: {
        title: 'Настройки',
        profile: 'Профиль',
        name: 'Имя',
        weight: 'Вес',
        height: 'Рост',
        avatar: 'Аватар',
        avatarUrl: 'URL аватара',
        updateAvatar: 'Обновить аватар',
        workoutPlan: 'План тренировок',
        selectPlan: 'Выберите план',
        language: 'Язык',
        selectLanguage: 'Выберите язык',
        customExercises: 'Пользовательские упражнения',
        addExercise: 'Добавить упражнение',
        exerciseName: 'Название упражнения',
        exerciseReps: 'Повторы',
        saveCustomPlan: 'Сохранить пользовательский план',
        deleteExercise: 'Удалить упражнение',
        kg: 'кг',
        cm: 'см'
    },
    shop: {
        title: 'Магазин',
        themes: 'Темы',
        primaryColors: 'Основные цвета',
        colorPicker: 'Выбор цвета',
        purchase: 'Купить',
        owned: 'Принадлежит',
        apply: 'Применить',
        active: 'Активно',
        free: 'Бесплатно',
        notEnoughCoins: 'Недостаточно монет',
        purchaseSuccess: 'Покупка успешна',
        applySuccess: 'Тема успешно применена',
        costCoinsEachTime: 'стоимость 100 монет каждый раз',
        darkTheme: 'Темная тема',
        emeraldTheme: 'Изумрудная тема',
        skyTheme: 'Небесная тема',
        whiteTheme: 'Белая тема',
        backgroundGradient: 'Фоновый градиент',
        forestTheme: 'Лесная тема',
        emeraldColor: 'Изумруд',
        skyColor: 'Небо',
        pinkColor: 'Розовый',
        yellowColor: 'Желтый',
        whiteColor: 'Белый',
        selectedColor: 'Выбранный цвет:',
        sampleText: 'Пример текста',
        howTextWillLook: 'Так будет выглядеть ваш текст',
        customPrimaryColor: 'Пользовательский основной цвет',
        chooseTextColor: 'Выберите цвет текста',
        preview: 'Предпросмотр:'
    },
    top: {
        title: 'Топ пользователей',
        leaderboard: 'Таблица лидеров',
        position: 'Позиция',
        username: 'Имя пользователя',
        totalCoins: 'Всего монет',
        streak: 'Серия',
        totalWorkouts: 'Всего тренировок',
        totalExercises: 'Всего упражнений',
        totalCalories: 'Всего калорий',
        averageCaloriesPerDay: 'Средние калории в день',
        dayStreak: 'Дневная серия',
        lastWorkout: 'Последняя тренировка',
        userStatistics: 'Статистика пользователя',
        loadingStatistics: 'Загрузка статистики...',
        failedToLoadStats: 'Не удалось загрузить статистику',
        close: 'Закрыть',
        viewStats: 'Посмотреть статистику',
        noUsers: 'Пользователи не найдены'
    },
    auth: {
        login: 'Вход',
        register: 'Регистрация',
        username: 'Имя пользователя',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        loginButton: 'Войти',
        registerButton: 'Зарегистрироваться',
        switchToRegister: 'Нет аккаунта? Зарегистрируйтесь',
        switchToLogin: 'Уже есть аккаунт? Войдите',
        loginSuccess: 'Успешный вход',
        registerSuccess: 'Успешная регистрация',
        loginError: 'Ошибка входа',
        registerError: 'Ошибка регистрации',
        logoutSuccess: 'Успешный выход'
    },
    onboarding: {
        welcome: 'Добро пожаловать в MuscleRise',
        getStarted: 'Начать',
        setupProfile: 'Настройка профиля',
        enterDetails: 'Введите ваши данные',
        selectWorkoutPlan: 'Выберите план тренировок',
        choosePlan: 'Выберите ваш план тренировок',
        beginner: 'Начинающий',
        middle: 'Средний',
        hardcore: 'Продвинутый',
        custom: 'Пользовательский',
        finish: 'Завершить',
        skip: 'Пропустить'
    },
    exercises: {
        pushups: 'Отжимания',
        squats: 'Приседания',
        plank: 'Планка (сек)',
        wallSits: 'Приседания у стены (сек)',
        legRaises: 'Подъемы ног',
        lunges: 'Выпады',
        mountainClimbers: 'Альпинист',
        jumpingJacks: 'Прыжки с разведением',
        russianTwists: 'Русские скручивания',
        burpees: 'Берпи',
        diamondPushups: 'Алмазные отжимания',
        jumpSquats: 'Приседания с прыжком',
        pikePushups: 'Отжимания уголком',
        bearCrawls: 'Медвежья походка',
        singleLegGluteBridge: 'Мостик на одной ноге',
        bicycleCrunches: 'Велосипед',
        highKnees: 'Высокие колени'
    },
    plans: {
        beginner: 'Начальный уровень',
        middle: 'Средний уровень',
        hardcore: 'Продвинутый уровень',
        custom: 'Пользовательский план'
    },
    messages: {
        exerciseCompleted: 'Упражнение успешно выполнено',
        exerciseAlreadyCompleted: 'Упражнение уже выполнено сегодня',
        workoutSaved: 'Тренировка успешно сохранена',
        profileUpdated: 'Профиль успешно обновлен',
        settingsSaved: 'Настройки успешно сохранены',
        error: 'Произошла ошибка',
        success: 'Успех'
    }
};

// Translation object
const translations: Record<Language, Translations> = {
    en,
    uz,
    ru
};

// Get current language from localStorage or default to English
export const getCurrentLanguage = (): Language => {
    if (typeof window === 'undefined') return 'en';
    try {
        const saved = localStorage.getItem('language') as Language;
        const validLanguages = ['en', 'uz', 'ru'];
        if (saved && validLanguages.includes(saved)) {
            return saved;
        }
    } catch (e) {
        console.warn('Failed to get language from localStorage:', e);
    }
    return 'en';
};

// Set language in localStorage and trigger storage event for cross-tab sync
export const setLanguage = (lang: Language): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
        // Trigger storage event for other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'language',
            newValue: lang,
            oldValue: localStorage.getItem('language')
        }));
    }
};

// Get translations for current language
export const getTranslations = (lang?: Language): Translations => {
    const currentLang = lang || getCurrentLanguage();
    return translations[currentLang] || translations.en;
};

// Translation hook
// Translation hook - will be used with app state
export const useTranslation = () => {
    const currentLang = getCurrentLanguage();
    const t = getTranslations(currentLang);

    return {
        t,
        currentLang
    };
};

// Helper function to get translations with app state language
export const useTranslationWithState = (stateLang?: string) => {
    // Always prefer state language over localStorage
    const currentLang = (stateLang || getCurrentLanguage()) as Language;
    const t = getTranslations(currentLang);

    return {
        t,
        currentLang
    };
};

// Helper function to translate exercise names
export const translateExerciseName = (exerciseName: string, t: Translations): string => {
    const exerciseMap: Record<string, keyof Translations['exercises']> = {
        'Push-ups': 'pushups',
        'Squats': 'squats',
        'Plank (sec)': 'plank',
        'Wall Sits (sec)': 'wallSits',
        'Leg Raises': 'legRaises',
        'Lunges': 'lunges',
        'Mountain Climbers': 'mountainClimbers',
        'Jumping Jacks': 'jumpingJacks',
        'Russian Twists': 'russianTwists',
        'Burpees': 'burpees',
        'Diamond Push-ups': 'diamondPushups',
        'Jump Squats': 'jumpSquats',
        'Pike Push-ups': 'pikePushups',
        'Bear Crawls': 'bearCrawls',
        'Single Leg Glute Bridge': 'singleLegGluteBridge',
        'Bicycle Crunches': 'bicycleCrunches',
        'High Knees': 'highKnees',
        'Archer Push-ups': 'pushups', // Custom exercise, use pushups translation
        'Chest Dips': 'pushups' // Custom exercise, use pushups translation
    };

    const key = exerciseMap[exerciseName];
    return key ? t.exercises[key] : exerciseName;
};

// Helper function to translate plan names
export const translatePlanName = (planName: string, t: Translations): string => {
    const planMap: Record<string, keyof Translations['plans']> = {
        'Beginner Level': 'beginner',
        'Middle Level': 'middle',
        'Hardcore Level': 'hardcore',
        'Custom Plan': 'custom'
    };

    const key = planMap[planName];
    return key ? t.plans[key] : planName;
};

// Helper function to translate theme names
export const translateThemeName = (themeName: string, t: Translations): string => {
    const themeMap: Record<string, keyof Translations['shop']> = {
        'Dark Theme': 'darkTheme',
        'Emerald Theme': 'emeraldTheme',
        'Sky Theme': 'skyTheme',
        'White Theme': 'whiteTheme',
        'Background Gradient': 'backgroundGradient',
        'Forest Theme': 'forestTheme'
    };

    const key = themeMap[themeName];
    return key ? t.shop[key] : themeName;
};

// Helper function to translate color names
export const translateColorName = (colorName: string, t: Translations): string => {
    const colorMap: Record<string, keyof Translations['shop']> = {
        'Emerald': 'emeraldColor',
        'Sky': 'skyColor',
        'Pink': 'pinkColor',
        'Yellow': 'yellowColor',
        'White': 'whiteColor'
    };

    const key = colorMap[colorName];
    return key ? t.shop[key] : colorName;
};

// Language options for select
export const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'uz', label: 'O\'zbekcha' },
    { value: 'ru', label: 'Русский' }
];