export interface PageInfoConfig {
  title: string;
  description: string;
  tips: string[];
}

export const pageInfoConfig: Record<string, PageInfoConfig> = {
  dashboard: {
    title: "Dashboard Overview",
    description: "Your complete health and fitness overview in one place",
    tips: [
      "View all your health metrics at a glance",
      "Click 'Edit Layout' to customize card positions and sizes",
      "Add custom text cards for notes or goals using 'Add Card'", 
      "Drag cards to reorder them and resize using the hover controls",
      "Delete text cards you don't need (data cards can't be deleted)"
    ]
  },
  readiness: {
    title: "Readiness & Recovery",
    description: "Track your daily readiness scores and recovery metrics",
    tips: [
      "Monitor your HRV and readiness trends from Athlytic",
      "Use this data to plan your training intensity",
      "Add text cards for recovery notes or observations",
      "Switch to edit mode to customize the layout"
    ]
  },
  nutrition: {
    title: "Nutrition Tracking", 
    description: "Monitor your calorie intake and macro breakdown",
    tips: [
      "Track calories vs your 1,700 kcal daily target",
      "View macro breakdown from Lose It! data",
      "Add text cards for meal plans or nutrition notes",
      "Use edit mode to adjust card sizes and positions"
    ]
  },
  hydration: {
    title: "Hydration Tracking",
    description: "Monitor your daily water intake and hydration goals", 
    tips: [
      "Track water intake from Apple Health",
      "Monitor progress toward daily hydration goals",
      "Add text cards for hydration reminders or tips",
      "Customize the layout in edit mode"
    ]
  },
  training: {
    title: "Training Load",
    description: "Track workouts, intensity, and training progress",
    tips: [
      "View workout data from Apple Health and Apple Watch",
      "Monitor training intensity and volume trends",
      "Add text cards for workout plans or training notes",
      "Use edit mode to organize your training data"
    ]
  },
  habits: {
    title: "Habit Tracking",
    description: "Monitor daily habits and streaks from Habitify",
    tips: [
      "View habit completion rates and current streaks",
      "Track your progress over the last 7 days",
      "Add text cards for habit goals or motivation",
      "Note: Use Habitify mobile app to check off habits"
    ]
  },
  goals: {
    title: "Goals & Challenges", 
    description: "Manage your long-term goals and current challenges",
    tips: [
      "Edit your weight loss plan and 30-day challenge",
      "Add custom goal cards for new objectives",
      "Use the rich text editor to format your goals",
      "Delete any goal cards you no longer need"
    ]
  }
};

export function getPageInfo(pathname: string): PageInfoConfig | null {
  // Convert pathname to key (e.g., "/nutrition" -> "nutrition")
  const pageKey = pathname === '/' ? 'dashboard' : pathname.split('/')[1];
  return pageInfoConfig[pageKey] || null;
}
