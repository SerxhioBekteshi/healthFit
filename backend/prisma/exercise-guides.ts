// How to set up and how to move, per exercise name. Each text stays under the 500 character notes limit.
export const EXERCISE_GUIDES: Record<string, string> = {
  'Goblet Squat':
    'Position: Stand with feet slightly wider than shoulders, toes turned out a little. Hold one dumbbell vertically against your chest with both hands.\nMovement: Sit down between your knees, chest tall and heels flat, until your thighs are parallel to the floor. Push through your heels to stand up.',
  'Dumbbell Bench Press':
    'Position: Lie on a flat bench with feet on the floor, shoulder blades pinched together and a dumbbell in each hand above your chest.\nMovement: Lower the dumbbells slowly until your elbows are just below the bench line, then press them back up without letting them touch.',
  'Seated Row':
    'Position: Sit with knees slightly bent, feet on the pads and back straight. Grab the handle with your arms extended.\nMovement: Pull the handle to your belly and squeeze your shoulder blades together, then return slowly without rounding your back.',
  Plank:
    'Position: Rest on your forearms and toes, elbows under your shoulders, body in a straight line from head to heels.\nMovement: Hold the position, tightening your abs and glutes. Keep breathing and do not let your hips sag or rise.',
  'Romanian Deadlift':
    'Position: Stand with feet hip-width apart, holding the bar at thigh level with your knees slightly bent.\nMovement: Push your hips back and slide the bar down your legs, back flat, until you feel your hamstrings stretch. Drive your hips forward to stand tall.',
  'Lat Pulldown':
    'Position: Sit with your thighs under the pads and grip the bar slightly wider than your shoulders, arms extended.\nMovement: Pull the bar down to your upper chest, driving your elbows down and back. Return slowly until your arms are straight.',
  'Shoulder Press':
    'Position: Sit or stand tall with a dumbbell in each hand at shoulder height, palms facing forward and core tight.\nMovement: Press the dumbbells straight up until your arms are almost straight, then lower them back to shoulder height under control.',
  'Leg Press':
    'Position: Sit back in the seat with feet shoulder-width apart in the middle of the platform and your lower back pressed into the pad.\nMovement: Lower the platform until your knees reach about 90 degrees, then push it away through your heels without locking your knees.',
  'Push-ups':
    'Position: Place your hands slightly wider than your shoulders and your feet together, body in one straight line.\nMovement: Lower your chest to just above the floor with elbows at about 45 degrees, then push the floor away until your arms are straight.',
  Bike: 'Position: Set the seat so your knee is slightly bent at the bottom of the pedal stroke. Hold the handles lightly.\nMovement: Pedal at a steady, easy pace where you can still talk. Keep your back straight and shoulders relaxed.',
  'Barbell Bench Press':
    'Position: Lie on the bench with your eyes under the bar, feet flat and shoulder blades pinched. Grip the bar slightly wider than your shoulders.\nMovement: Lower the bar to your mid chest with control, then press it up and slightly back until your arms are straight.',
  'Bench Press':
    'Position: Lie on the bench with your eyes under the bar, feet flat and shoulder blades pinched. Grip the bar slightly wider than your shoulders.\nMovement: Lower the bar to your mid chest with control, then press it up and slightly back until your arms are straight.',
  'Overhead Press':
    'Position: Stand with feet hip-width apart, the bar on your upper chest, grip just outside your shoulders, glutes and abs tight.\nMovement: Press the bar straight up, moving your head slightly back and then forward under it, until your arms lock out. Lower it back to your chest.',
  'Triceps Pushdown':
    'Position: Stand facing the cable machine and grab the bar or rope with your elbows bent at 90 degrees and pinned to your sides.\nMovement: Push the handle down until your arms are straight and squeeze your triceps, then let it rise back to 90 degrees without moving your elbows.',
  Deadlift:
    'Position: Stand with the bar over your mid-foot and feet hip-width apart. Bend down, grip the bar just outside your legs, chest up and back flat.\nMovement: Push the floor away, keeping the bar close to your legs, until you stand fully upright. Lower it back along the same path.',
  'Pull-ups':
    'Position: Hang from the bar with an overhand grip slightly wider than your shoulders, arms fully extended, legs slightly bent.\nMovement: Pull your chest toward the bar by driving your elbows down until your chin passes it. Lower yourself slowly to a full hang.',
  'Weighted Pull-up':
    'Position: Attach the weight to a belt and hang from the bar with an overhand grip and arms fully extended.\nMovement: Pull your chest to the bar without swinging, then lower yourself slowly to a full hang.',
  'Barbell Curl':
    'Position: Stand tall holding the bar with an underhand, shoulder-width grip, arms extended and elbows at your sides.\nMovement: Curl the bar up toward your shoulders and squeeze your biceps at the top, then lower it slowly to full extension.',
  'Back Squat':
    'Position: Rest the bar on your upper back and grip it just outside your shoulders. Stand with feet slightly wider than your hips, toes a little out.\nMovement: Sit down and back, knees tracking over your toes, until your thighs are parallel to the floor. Drive up through your heels.',
  'Leg Curl':
    'Position: Lie face down (or sit) on the machine with the pad just above your heels and your hips pressed down.\nMovement: Curl your heels toward your glutes and squeeze your hamstrings, then lower the weight slowly without lifting your hips.',
  'Calf Raise':
    'Position: Stand with the balls of your feet on a step or platform, heels hanging off, holding something for balance.\nMovement: Rise as high as you can on your toes and pause for a second, then lower your heels below the step for a full stretch.',
  'Chest Press Machine':
    'Position: Sit with your back flat against the pad, the handles level with your mid chest and feet flat on the floor.\nMovement: Push the handles forward until your arms are almost straight, then return slowly until you feel a light stretch in your chest.',
  'Walking Lunges':
    'Position: Stand tall with feet together, hands on your hips or holding dumbbells.\nMovement: Step forward and lower until both knees are about 90 degrees and the back knee is just above the floor. Push off the front foot and step into the next lunge.',
};

// Guide first, then the gym's own short tip.
export const describeExercise = (name: string, tip = ''): string =>
  [EXERCISE_GUIDES[name], tip && `Tip: ${tip}`].filter(Boolean).join('\n');
