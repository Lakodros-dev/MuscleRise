import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useAppState } from "@/state/app-state";
import Layout from "../components/Layout";
import { UserProfile } from "@/state/app-state";
import { useTranslationWithState, languageOptions, translatePlanName } from "@/lib/i18n";

const Settings = memo(function Settings() {
  const { state, dispatch } = useAppState();
  const { t } = useTranslationWithState(state.language);

  // Defensive check for state
  if (!state) {
    return (
      <Layout>
        <div className="w-full min-h-screen px-2 py-4 flex items-center justify-center">
          <div className="text-center p-4 bg-red-100 dark:bg-red-900 rounded-lg max-w-md">
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Application Error</h2>
            <p className="text-red-700 dark:text-red-300">Unable to load application state. Please refresh the page.</p>
          </div>
        </div>
      </Layout>
    );
  }
  // Defensive checks for user data
  const user = (state.user || {}) as Partial<UserProfile>;

  const [name, setName] = useState<string>(user.name || "");
  const [weight, setWeight] = useState<number>(user.weightKg || 70);
  const [height, setHeight] = useState<number>(user.heightCm || 170);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || "");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [isCustomPlanModalOpen, setIsCustomPlanModalOpen] = useState(false);
  const [tempCustomExercises, setTempCustomExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseReps, setExerciseReps] = useState(10);
  const [userExerciseStats, setUserExerciseStats] = useState<any>(null);
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);

  // Initialize custom exercises from server data
  useEffect(() => {
    if (state.user?.id) {
      const loadUserData = async () => {
        try {
          const { makeApiRequest } = await import("@/lib/api-utils");

          // Fetch latest user data from server to get custom exercises
          const userResponse = await makeApiRequest(`/auth/user/${state.user.id}`);
          if (userResponse.success) {
            // Custom exercises are now handled in modal
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to load user data:', userResponse.error);
            }
          }

          // Exercise statistics temporarily disabled
          // const exerciseResponse = await makeApiRequest(`/auth/user/${state.user.id}/exercises`);
          // if (exerciseResponse.success) {
          //   setUserExerciseStats(exerciseResponse.data);
          // }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to load user data:', e);
          }
        }
      };

      loadUserData();
    }
  }, [state.user?.id]);





  const handleSave = useCallback(async () => {
    const updates = { name, weightKg: weight, heightCm: height, avatarUrl };
    dispatch({ type: "UPDATE_SETTINGS", payload: updates });

    // Save to server if user is logged in
    if (state.user?.id) {
      try {
        const { updateUser } = await import("@/lib/api-utils");
        await updateUser(state.user.id, updates);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to save settings to server:', e);
        }
      }
    }
  }, [name, weight, height, avatarUrl, dispatch, state.user?.id]);

  const handlePlanSelect = useCallback(async (planId: string) => {
    if (planId === "custom-plan") {
      // Always open modal for custom plan (create new or edit existing)
      setIsCustomPlanModalOpen(true);
      return;
    }

    dispatch({ type: "SELECT_PLAN", payload: { planId } });

    // Save to server if user is logged in
    if (state.user?.id) {
      try {
        const { updateUser } = await import("@/lib/api-utils");
        await updateUser(state.user.id, { planId });
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to save plan selection to server:', e);
        }
      }
    }
  }, [dispatch, state.user?.id]);

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API
      const { logoutUser } = await import("@/lib/api-utils");
      await logoutUser();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }

    // Clear user data from state
    dispatch({ type: "LOGOUT" });

    // Clear any local storage
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('mr_app_state_v1');

    // Navigate to home page and show auth modal
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }, [dispatch]);

  const handleAvatarSave = useCallback(async () => {
    const trimmedUrl = newAvatarUrl.trim();
    setAvatarUrl(trimmedUrl);
    dispatch({ type: "UPDATE_SETTINGS", payload: { avatarUrl: trimmedUrl } });

    // Save to server if user is logged in
    if (state.user?.id) {
      try {
        const { updateUser } = await import("@/lib/api-utils");
        await updateUser(state.user.id, { avatarUrl: trimmedUrl });
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to save avatar to server:', e);
        }
      }
    }

    setIsAvatarModalOpen(false);
    setNewAvatarUrl("");
  }, [newAvatarUrl, dispatch, state.user?.id]);

  const addExerciseToTemp = async () => {
    if (!selectedExercise) return;

    const newExercise = {
      id: `temp-${Date.now()}`,
      name: selectedExercise,
      reps: exerciseReps
    };

    setTempCustomExercises([...tempCustomExercises, newExercise]);

    // Save exercise selection to user's data
    if (state.user?.id) {
      try {
        // Get category from the selected exercise
        const getExerciseCategory = (exerciseName: string) => {
          const chestExercises = ['Push-ups', 'Diamond Push-ups', 'Wide Grip Push-ups', 'Incline Push-ups', 'Decline Push-ups', 'Pike Push-ups', 'Single Arm Push-ups', 'Archer Push-ups', 'Clap Push-ups', 'Hindu Push-ups', 'Chest Dips'];
          const legExercises = ['Squats', 'Jump Squats', 'Sumo Squats', 'Pistol Squats', 'Bulgarian Split Squats', 'Lunges', 'Reverse Lunges', 'Walking Lunges', 'Lateral Lunges', 'Curtsy Lunges', 'Glute Bridges', 'Single Leg Glute Bridge', 'Hip Thrusts', 'Calf Raises', 'Single Leg Calf Raises', 'Wall Sits'];
          const coreExercises = ['Plank', 'Side Plank', 'Plank Up-Downs', 'Plank Jacks', 'Sit-ups', 'Crunches', 'Bicycle Crunches', 'Russian Twists', 'Leg Raises', 'Hanging Leg Raises', 'V-ups', 'Dead Bug', 'Mountain Climbers', 'Flutter Kicks', 'Hollow Body Hold'];
          const backExercises = ['Pull-ups', 'Chin-ups', 'Inverted Rows', 'Superman', 'Reverse Fly', 'Bird Dog', 'Prone Y-Raises', 'Prone T-Raises', 'Prone W-Raises', 'Wall Angels', 'Shoulder Blade Squeezes'];
          const armExercises = ['Tricep Dips', 'Chair Dips', 'Tricep Push-ups', 'Pike Push-ups', 'Handstand Push-ups', 'Arm Circles', 'Overhead Press (Bodyweight)', 'Isometric Holds', 'Wall Push-ups', 'Finger Push-ups'];
          const cardioExercises = ['Burpees', 'Jumping Jacks', 'High Knees', 'Butt Kicks', 'Jump Rope (Imaginary)', 'Star Jumps', 'Tuck Jumps', 'Broad Jumps', 'Lateral Bounds', 'Cross Country Skiers', 'Boxing Punches'];
          const fullBodyExercises = ['Bear Crawls', 'Crab Walks', 'Duck Walks', 'Lizard Crawls', 'Inchworms', 'Turkish Get-ups', 'Sprawls', 'Thrusters (Bodyweight)', 'Squat to Press', 'Step-ups', 'Box Jumps'];

          if (chestExercises.includes(exerciseName)) return 'Chest';
          if (legExercises.includes(exerciseName)) return 'Legs & Glutes';
          if (coreExercises.includes(exerciseName)) return 'Core & Abs';
          if (backExercises.includes(exerciseName)) return 'Back & Shoulders';
          if (armExercises.includes(exerciseName)) return 'Arms';
          if (cardioExercises.includes(exerciseName)) return 'Cardio & HIIT';
          if (fullBodyExercises.includes(exerciseName)) return 'Full Body & Functional';
          return 'Other';
        };

        // Fetch current user data to get existing selected exercises
        const { makeApiRequest } = await import("@/lib/api-utils");
        const userResponse = await makeApiRequest(`/auth/user/${state.user.id}`);

        if (!userResponse.success) {
          throw new Error(`Failed to fetch user data: ${userResponse.error}`);
        }

        const existingExercises = userResponse.data?.user?.selectedExercises || [];

        // Check if exercise already exists, if so update usage count
        const existingIndex = existingExercises.findIndex(
          (ex: any) => ex.exerciseName === selectedExercise
        );

        let updatedExercises;
        if (existingIndex !== -1) {
          // Update existing exercise
          updatedExercises = [...existingExercises];
          updatedExercises[existingIndex] = {
            ...updatedExercises[existingIndex],
            reps: exerciseReps,
            timesUsed: (updatedExercises[existingIndex].timesUsed || 0) + 1,
            lastUsed: new Date().toISOString()
          };
        } else {
          // Add new exercise
          const exerciseData = {
            exerciseName: selectedExercise,
            category: getExerciseCategory(selectedExercise),
            reps: exerciseReps,
            dateAdded: new Date().toISOString(),
            timesUsed: 1,
            lastUsed: new Date().toISOString()
          };
          updatedExercises = [...existingExercises, exerciseData];
        }

        // Save updated exercises to server
        const { updateUser } = await import("@/lib/api-utils");
        await updateUser(state.user.id, { selectedExercises: updatedExercises });
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to save exercise selection to server:', e);
        }
      }
    }

    setSelectedExercise("");
    setExerciseReps(10);
  };

  const removeExerciseFromTemp = (id: string) => {
    setTempCustomExercises(tempCustomExercises.filter(ex => ex.id !== id));
  };

  const saveCustomPlan = async () => {
    if (tempCustomExercises.length === 0) return;

    // Format custom exercises for server
    const formattedExercises = tempCustomExercises.map(ex => ({
      id: ex.name,
      name: ex.name,
      reps: ex.reps
    }));

    console.log('💾 Saving custom exercises:', formattedExercises);

    // Save custom plan to server and update state
    if (state.user?.id) {
      try {
        const { updateUser } = await import("@/lib/api-utils");
        const response = await updateUser(state.user.id, {
          customExercises: formattedExercises,
          customPlanName: "Custom Plan",
          planId: "custom-plan",
          currentPlanId: "custom-plan"
        });
        console.log('✅ Custom exercises saved successfully:', response);
      } catch (e) {
        console.error('❌ Failed to save custom plan to server:', e);
      }
    }

    // Update local state with custom exercises (this will automatically select custom plan)
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: {
        customExercises: formattedExercises,
        customPlanName: "Custom Plan",
        planId: "custom-plan"
      }
    });

    setIsCustomPlanModalOpen(false);
    setTempCustomExercises([]);
    console.log('🎯 Custom plan created and automatically selected');
  };

  return (
    <Layout>
      <div className="w-full min-h-screen px-2 py-4">
        <div className="flex justify-between items-center mb-6 w-full">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-center flex-1">{t.settings.title}</h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              {t.nav.logout}
            </button>
          </div>
        </div>

        <div className="max-w-md">

          {/* Avatar Section */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{t.settings.avatar}</h2>
            <div className="flex items-start space-x-4">
              <div
                className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 cursor-pointer group"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/120x120/e5e7eb/9ca3af?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Modal */}
          {isAvatarModalOpen && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">{t.settings.updateAvatar}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.settings.avatarUrl}</label>
                    <input
                      type="url"
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                      placeholder="Enter image URL"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  {newAvatarUrl && (
                    <div className="flex justify-start">
                      <img
                        src={newAvatarUrl}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80/ef4444/ffffff?text=Error";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setIsAvatarModalOpen(false);
                        setNewAvatarUrl("");
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      onClick={handleAvatarSave}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t.common.save}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language Section */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{t.settings.language}</h2>
            <div>
              <label className="block text-sm font-medium mb-2">{t.settings.selectLanguage}</label>
              <select
                value={state.language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  // Update app state (this will also save to localStorage via the reducer)
                  dispatch({ type: "SET_LANGUAGE", payload: { language: newLang } });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t.settings.name}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.settings.weight} ({t.settings.kg})</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="30"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t.settings.height} ({t.settings.cm})</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="100"
                  max="250"
                />
              </div>
            </div>
          </div>

          {/* Workout Plan Selection */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{t.settings.workoutPlan}</h2>
            <select
              value={state.workoutPlanId}
              onChange={(e) => handlePlanSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {state.workoutPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {translatePlanName(plan.name, t)}
                </option>
              ))}
              {/* Only show "Create Custom Plan" option if user doesn't have custom plan yet */}
              {!state.workoutPlans.find(plan => plan.id === "custom-plan") && (
                <option value="custom-plan">Create Custom Plan</option>
              )}
            </select>
          </div>

          {/* Exercise History Section - Temporarily disabled */}
          {false && userExerciseStats && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Exercise History</h2>
                <button
                  onClick={() => setShowExerciseHistory(!showExerciseHistory)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showExerciseHistory ? 'Hide' : 'Show'} Details
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-lg font-bold text-blue-600">{userExerciseStats.stats?.totalExercises || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Exercises</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-lg font-bold text-green-600">{userExerciseStats.stats?.totalUsage || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Times Used</div>
                </div>
              </div>

              {/* Detailed View */}
              {showExerciseHistory && (
                <div className="space-y-4">
                  {userExerciseStats.stats?.mostUsedExercise && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Most Used: {userExerciseStats.stats.mostUsedExercise.exerciseName}
                      </div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-300">
                        {userExerciseStats.stats.mostUsedExercise.timesUsed} times • {userExerciseStats.stats.mostUsedExercise.category}
                      </div>
                    </div>
                  )}

                  {userExerciseStats.stats?.recentExercises?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Exercises:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {userExerciseStats.stats.recentExercises.map((exercise: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                            <span>{exercise.exerciseName}</span>
                            <span className="text-gray-500 text-xs">
                              {exercise.reps} reps • {exercise.timesUsed}x used
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom Plan Modal */}
          {isCustomPlanModalOpen && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto mx-auto">
                <h3 className="text-lg font-semibold mb-4">Create Custom Plan</h3>

                {/* Exercise Selection */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Exercise</option>

                      {/* Chest Exercises */}
                      <optgroup label="Chest">
                        <option value="Push-ups">Push-ups</option>
                        <option value="Diamond Push-ups">Diamond Push-ups</option>
                        <option value="Wide Grip Push-ups">Wide Grip Push-ups</option>
                        <option value="Incline Push-ups">Incline Push-ups</option>
                        <option value="Decline Push-ups">Decline Push-ups</option>
                        <option value="Pike Push-ups">Pike Push-ups</option>
                        <option value="Single Arm Push-ups">Single Arm Push-ups</option>
                        <option value="Archer Push-ups">Archer Push-ups</option>
                        <option value="Clap Push-ups">Clap Push-ups</option>
                        <option value="Hindu Push-ups">Hindu Push-ups</option>
                        <option value="Chest Dips">Chest Dips</option>
                      </optgroup>

                      {/* Legs & Glutes */}
                      <optgroup label="Legs & Glutes">
                        <option value="Squats">Squats</option>
                        <option value="Jump Squats">Jump Squats</option>
                        <option value="Sumo Squats">Sumo Squats</option>
                        <option value="Pistol Squats">Pistol Squats</option>
                        <option value="Bulgarian Split Squats">Bulgarian Split Squats</option>
                        <option value="Lunges">Lunges</option>
                        <option value="Reverse Lunges">Reverse Lunges</option>
                        <option value="Walking Lunges">Walking Lunges</option>
                        <option value="Lateral Lunges">Lateral Lunges</option>
                        <option value="Curtsy Lunges">Curtsy Lunges</option>
                        <option value="Glute Bridges">Glute Bridges</option>
                        <option value="Single Leg Glute Bridge">Single Leg Glute Bridge</option>
                        <option value="Hip Thrusts">Hip Thrusts</option>
                        <option value="Calf Raises">Calf Raises</option>
                        <option value="Single Leg Calf Raises">Single Leg Calf Raises</option>
                        <option value="Wall Sits">Wall Sits</option>
                      </optgroup>

                      {/* Core & Abs */}
                      <optgroup label="Core & Abs">
                        <option value="Plank">Plank</option>
                        <option value="Side Plank">Side Plank</option>
                        <option value="Plank Up-Downs">Plank Up-Downs</option>
                        <option value="Plank Jacks">Plank Jacks</option>
                        <option value="Sit-ups">Sit-ups</option>
                        <option value="Crunches">Crunches</option>
                        <option value="Bicycle Crunches">Bicycle Crunches</option>
                        <option value="Russian Twists">Russian Twists</option>
                        <option value="Leg Raises">Leg Raises</option>
                        <option value="Hanging Leg Raises">Hanging Leg Raises</option>
                        <option value="V-ups">V-ups</option>
                        <option value="Dead Bug">Dead Bug</option>
                        <option value="Mountain Climbers">Mountain Climbers</option>
                        <option value="Flutter Kicks">Flutter Kicks</option>
                        <option value="Hollow Body Hold">Hollow Body Hold</option>
                      </optgroup>

                      {/* Back & Shoulders */}
                      <optgroup label="Back & Shoulders">
                        <option value="Pull-ups">Pull-ups</option>
                        <option value="Chin-ups">Chin-ups</option>
                        <option value="Inverted Rows">Inverted Rows</option>
                        <option value="Superman">Superman</option>
                        <option value="Reverse Fly">Reverse Fly</option>
                        <option value="Bird Dog">Bird Dog</option>
                        <option value="Prone Y-Raises">Prone Y-Raises</option>
                        <option value="Prone T-Raises">Prone T-Raises</option>
                        <option value="Prone W-Raises">Prone W-Raises</option>
                        <option value="Wall Angels">Wall Angels</option>
                        <option value="Shoulder Blade Squeezes">Shoulder Blade Squeezes</option>
                      </optgroup>

                      {/* Arms */}
                      <optgroup label="Arms">
                        <option value="Tricep Dips">Tricep Dips</option>
                        <option value="Chair Dips">Chair Dips</option>
                        <option value="Tricep Push-ups">Tricep Push-ups</option>
                        <option value="Pike Push-ups">Pike Push-ups</option>
                        <option value="Handstand Push-ups">Handstand Push-ups</option>
                        <option value="Arm Circles">Arm Circles</option>
                        <option value="Overhead Press (Bodyweight)">Overhead Press (Bodyweight)</option>
                        <option value="Isometric Holds">Isometric Holds</option>
                        <option value="Wall Push-ups">Wall Push-ups</option>
                        <option value="Finger Push-ups">Finger Push-ups</option>
                      </optgroup>

                      {/* Cardio & HIIT */}
                      <optgroup label="Cardio & HIIT">
                        <option value="Burpees">Burpees</option>
                        <option value="Jumping Jacks">Jumping Jacks</option>
                        <option value="High Knees">High Knees</option>
                        <option value="Butt Kicks">Butt Kicks</option>
                        <option value="Jump Rope (Imaginary)">Jump Rope (Imaginary)</option>
                        <option value="Star Jumps">Star Jumps</option>
                        <option value="Tuck Jumps">Tuck Jumps</option>
                        <option value="Broad Jumps">Broad Jumps</option>
                        <option value="Lateral Bounds">Lateral Bounds</option>
                        <option value="Cross Country Skiers">Cross Country Skiers</option>
                        <option value="Boxing Punches">Boxing Punches</option>
                      </optgroup>

                      {/* Full Body & Functional */}
                      <optgroup label="Full Body & Functional">
                        <option value="Bear Crawls">Bear Crawls</option>
                        <option value="Crab Walks">Crab Walks</option>
                        <option value="Duck Walks">Duck Walks</option>
                        <option value="Lizard Crawls">Lizard Crawls</option>
                        <option value="Inchworms">Inchworms</option>
                        <option value="Turkish Get-ups">Turkish Get-ups</option>
                        <option value="Sprawls">Sprawls</option>
                        <option value="Thrusters (Bodyweight)">Thrusters (Bodyweight)</option>
                        <option value="Squat to Press">Squat to Press</option>
                        <option value="Step-ups">Step-ups</option>
                        <option value="Box Jumps">Box Jumps</option>
                      </optgroup>

                    </select>
                    <input
                      type="number"
                      value={exerciseReps}
                      onChange={(e) => setExerciseReps(Number(e.target.value))}
                      placeholder="Reps"
                      min="1"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={addExerciseToTemp}
                    disabled={!selectedExercise}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Add Exercise
                  </button>
                </div>

                {/* Exercise List */}
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-2">Added Exercises:</h4>
                  {tempCustomExercises.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No exercises added yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tempCustomExercises.map((exercise) => (
                        <div key={exercise.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm">{exercise.name} - {exercise.reps} reps</span>
                          <button
                            onClick={() => removeExerciseFromTemp(exercise.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsCustomPlanModalOpen(false);
                      setTempCustomExercises([]);
                      setSelectedExercise("");
                      setExerciseReps(10);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCustomPlan}
                    disabled={tempCustomExercises.length === 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Ready
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            {t.common.save} {t.settings.title}
          </button>
        </div>
      </div>
    </Layout>
  );
});

export default Settings;