import type { Exercise } from '@/domain/types'

/**
 * Exercise library.
 * Sources: SA = Snowboard Addiction × Jeremy Watkins 24-min workout,
 * MD-HIIT = Mobility Duo "The Workout Every Snowboarder Should Be Doing",
 * MD-30 = Mobility Duo 30-min DPT workout, BUR = Burton injury-prevention moves,
 * R = general snowboard conditioning research.
 */
const KB = ['kettlebell', 'dumbbells'] as Exercise['equipment']

export const EXERCISES: Exercise[] = [
  // ───────────── Warm-up ─────────────
  {
    id: 'cat-cow', name: 'Cat-Cow', category: 'warmup', slots: ['warmup'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', clip: 'catCow', source: 'SA',
    cues: ['Inhale: drop the belly, lift the chest', 'Exhale: round the spine to the ceiling', 'Move slowly, one vertebra at a time'],
    whyForRiding: 'Wakes up the spine so you can soak up chatter and stay loose through bumpy runs.',
  },
  {
    id: 'worlds-greatest-stretch', name: "World's Greatest Stretch", category: 'warmup', slots: ['warmup', 'mobility'],
    equipment: [], difficulty: 1, mode: 'time', perSide: true, clip: 'worldsGreatest', source: 'SA',
    cues: ['Step into a deep lunge, hands inside the front foot', 'Drop the elbow toward the instep', 'Rotate and reach the arm to the sky'],
    whyForRiding: 'Opens hips, hamstrings and upper back in one move — the exact ranges a low, rotated riding stance needs.',
  },
  {
    id: 'inchworm', name: 'Inchworm', category: 'warmup', slots: ['warmup'], equipment: [], difficulty: 1, mode: 'time',
    clip: 'inchworm', source: 'SA',
    cues: ['Hinge and walk the hands out to a plank', 'Keep legs as straight as you can', 'Walk the hands back and roll up tall'],
    whyForRiding: 'Warms hamstrings, shoulders and core together — the muscles that catch you when you fall forward.',
  },
  {
    id: 'tspine-rotation', name: 'Half-Kneeling T-Spine Rotation', category: 'warmup', slots: ['warmup', 'mobility'],
    equipment: [], difficulty: 1, mode: 'time', perSide: true, clip: 'tspineRotation', source: 'MD-30',
    cues: ['Half-kneel, squeeze the down-side glute', 'Rotate the chest, not the hips', 'Follow the moving hand with your eyes'],
    whyForRiding: 'Upper-back rotation lets you lead turns with your shoulders while hips stay stacked over the board.',
  },
  {
    id: 'leg-swings', name: 'Leg Swings', category: 'warmup', slots: ['warmup'], equipment: [], difficulty: 1,
    mode: 'time', perSide: true, clip: 'legSwings', source: 'R',
    cues: ['Stand tall, light hand on a wall if needed', 'Swing from the hip, keep the torso quiet', 'Grow the range each swing'],
    whyForRiding: 'Dynamic hip range for big carves and catching your balance after landings.',
  },
  {
    id: 'hip-circles', name: 'Hip Circles', category: 'warmup', slots: ['warmup'], equipment: [], difficulty: 1,
    mode: 'time', clip: 'hipCircles', source: 'R',
    cues: ['Hands on hips, feet shoulder-width', 'Draw big slow circles with the pelvis', 'Switch direction halfway'],
    whyForRiding: 'Lubricates the hips and lower back before loading them in a snowboard stance.',
  },
  {
    id: 'ankle-rocks', name: 'Ankle Rocks', category: 'warmup', slots: ['warmup', 'mobility'], equipment: [], difficulty: 1,
    mode: 'time', perSide: true, clip: 'ankleRocks', source: 'R',
    cues: ['Half-kneel, front foot flat', 'Drive the knee forward past the toes', 'Keep the heel glued to the floor'],
    whyForRiding: 'Ankle flex lets you drop into your bindings’ forward lean without your knees caving in.',
  },
  {
    id: 'arm-circles', name: 'Arm Circles', category: 'warmup', slots: ['warmup'], equipment: [], difficulty: 1,
    mode: 'time', clip: 'armCircles', source: 'R',
    cues: ['Arms straight out to the sides', 'Start small, grow to big circles', 'Reverse direction halfway'],
    whyForRiding: 'Preps the shoulders — one of the most common snowboard injury spots.',
  },
  {
    id: 'wrist-rocks', name: 'Wrist Mobility Rocks', category: 'warmup', slots: ['warmup'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', clip: 'wristRocks', source: 'BUR',
    cues: ['On all fours, palms flat', 'Rock the shoulders forward past the wrists', 'Ease back and repeat smoothly'],
    whyForRiding: 'Wrists take the hit when you reach out to catch a fall. Mobile wrists are more resilient wrists.',
  },
  {
    id: 'jumping-jacks', name: 'Jumping Jacks', category: 'warmup', slots: ['warmup', 'cardio'], equipment: [],
    difficulty: 1, mode: 'time', impact: true, clip: 'jumpingJacks', source: 'R',
    cues: ['Land softly on the balls of the feet', 'Arms all the way overhead', 'Find a steady rhythm'],
    whyForRiding: 'Raises your heart rate and primes springy ankles.',
  },

  // ───────────── Mobility ─────────────
  {
    id: 'ninety-ninety', name: '90/90 Hip Switches', category: 'mobility', slots: ['mobility', 'cooldown'], equipment: [],
    needs: ['mat'], difficulty: 1, mode: 'time', clip: 'ninetyNinety', source: 'SA',
    cues: ['Sit tall, both knees bent to 90°', 'Rotate both knees to the other side', 'Keep the chest proud, hands behind if needed'],
    whyForRiding: 'Trains internal and external hip rotation — the hips are constantly rotating between toe- and heel-side turns.',
  },
  {
    id: 'hip-flexor-stretch', name: 'Kneeling Hip Flexor Stretch', category: 'mobility', slots: ['mobility', 'cooldown'],
    equipment: [], needs: ['mat'], difficulty: 1, mode: 'time', perSide: true, clip: 'hipFlexorStretch', source: 'R',
    cues: ['Half-kneel, tuck the tailbone', 'Shift hips forward gently', 'Reach the same-side arm up and over'],
    whyForRiding: 'Hours of sitting and riding in a crouch tighten hip flexors. Opening them protects the lower back.',
  },
  {
    id: 'cossack-squat', name: 'Cossack Squat', category: 'mobility', slots: ['mobility', 'lunge'], equipment: [],
    difficulty: 2, mode: 'reps', repScale: 1.5, secPerRep: 3.5, clip: 'cossack', source: 'R',
    cues: ['Wide stance, shift into one hip', 'Straight leg toes point up', 'Stay tall, sink as deep as you control'],
    whyForRiding: 'Builds strength at the end of your range — great for wide stances and recovering from awkward landings.',
  },
  {
    id: 'deep-squat-hold', name: 'Deep Squat Pry', category: 'mobility', slots: ['mobility', 'cooldown'], equipment: [],
    difficulty: 1, mode: 'time', clip: 'deepSquatHold', source: 'R',
    cues: ['Sink to the bottom of a squat', 'Elbows gently push the knees out', 'Breathe and shift side to side'],
    whyForRiding: 'Owning a deep squat makes a low, stable riding position feel easy.',
  },
  {
    id: 'thread-needle', name: 'Thread the Needle', category: 'mobility', slots: ['mobility', 'cooldown'], equipment: [],
    needs: ['mat'], difficulty: 1, mode: 'time', perSide: true, clip: 'threadNeedle', source: 'R',
    cues: ['From all fours, open the arm to the sky', 'Thread it under the opposite arm', 'Let the shoulder melt to the floor'],
    whyForRiding: 'Restores upper-back rotation and eases shoulders after a day of strapping in and pushing.',
  },

  // ───────────── Cool-down ─────────────
  {
    id: 'pigeon-stretch', name: 'Pigeon Stretch', category: 'cooldown', slots: ['cooldown'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', perSide: true, clip: 'pigeon', source: 'R',
    cues: ['Front shin across, back leg long', 'Square the hips toward the floor', 'Fold forward and breathe slowly'],
    whyForRiding: 'Releases the glutes and outer hips that work overtime holding an edge.',
  },
  {
    id: 'childs-pose', name: "Child's Pose", category: 'cooldown', slots: ['cooldown'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', clip: 'childPose', source: 'R',
    cues: ['Knees wide, sit back to the heels', 'Reach the arms long', 'Breathe into the lower back'],
    whyForRiding: 'Decompresses the spine after impacts and jumps.',
  },
  {
    id: 'quad-stretch', name: 'Standing Quad Stretch', category: 'cooldown', slots: ['cooldown'], equipment: [],
    difficulty: 1, mode: 'time', perSide: true, clip: 'quadStretch', source: 'R',
    cues: ['Stand tall, grab the ankle behind you', 'Knees side by side, tuck the hips', 'Hold a wall for balance if needed'],
    whyForRiding: 'Quads are your shock absorbers on the hill. Give them some love after training.',
  },
  {
    id: 'forward-fold', name: 'Standing Forward Fold', category: 'cooldown', slots: ['cooldown'], equipment: [],
    difficulty: 1, mode: 'time', clip: 'forwardFold', source: 'R',
    cues: ['Soft knees, hinge from the hips', 'Let the head and arms hang heavy', 'Sway gently side to side'],
    whyForRiding: 'Lengthens hamstrings and the lower back, which tighten from a riding crouch.',
  },
  {
    id: 'foam-roll-quads', name: 'Foam Roll Quads', category: 'cooldown', slots: ['cooldown'], equipment: ['foamRoller'],
    difficulty: 1, mode: 'time', clip: 'foamRollQuads', source: 'R',
    cues: ['Roller under the thighs, forearms down', 'Roll slowly from hip to above the knee', 'Pause on tight spots and breathe'],
    whyForRiding: 'Speeds up recovery for the muscles that take the most load riding.',
  },
  {
    id: 'foam-roll-calves', name: 'Foam Roll Calves', category: 'cooldown', slots: ['cooldown'], equipment: ['foamRoller'],
    difficulty: 1, mode: 'time', clip: 'foamRollCalves', source: 'R',
    cues: ['Roller under the calves, hips lifted', 'Roll from ankle to below the knee', 'Cross one leg over for more pressure'],
    whyForRiding: 'Calves stay loaded all day in stiff boots. Keep them supple.',
  },

  // ───────────── Core ─────────────
  {
    id: 'dead-bug', name: 'Dead Bug', category: 'core', slots: ['coreAntiExt'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', clip: 'deadBug', source: 'SA', harder: 'hollow-hold',
    cues: ['Low back pressed into the floor', 'Extend opposite arm and leg slowly', 'Exhale as you reach'],
    whyForRiding: 'Teaches your trunk to stay solid while arms and legs move — that’s balance on a moving board.',
  },
  {
    id: 'side-plank', name: 'Side Plank', category: 'core', slots: ['coreAntiRot'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', perSide: true, clip: 'sidePlank', source: 'SA', harder: 'side-plank-dips',
    cues: ['Elbow under the shoulder', 'Straight line from head to heels', 'Push the floor away, hips high'],
    whyForRiding: 'Strong obliques and hips keep you stacked when edging hard and resisting twisting falls.',
  },
  {
    id: 'side-plank-dips', name: 'Side Plank Hip Dips', category: 'core', slots: ['coreAntiRot'], equipment: [], needs: ['mat'],
    difficulty: 2, mode: 'reps', perSide: true, clip: 'sidePlankDips', source: 'R', easier: 'side-plank', harder: 'side-plank-reach',
    cues: ['Lower the hip toward the floor', 'Drive it back up past straight', 'Keep the shoulder packed'],
    whyForRiding: 'Lateral core strength for holding a heel-side carve without folding at the waist.',
  },
  {
    id: 'side-plank-reach', name: 'Side Plank Reach-Under', category: 'core', slots: ['coreAntiRot', 'coreRot'], equipment: [],
    needs: ['mat'], difficulty: 2, mode: 'reps', perSide: true, clip: 'sidePlankReach', source: 'BUR', easier: 'side-plank',
    harder: 'copenhagen-plank',
    cues: ['Hold a strong side plank', 'Thread the top arm under your torso', 'Rotate back open to the sky'],
    whyForRiding: 'Builds rotational control and rotator-cuff stability for safer falls.',
  },
  {
    id: 'plank', name: 'Forearm Plank', category: 'core', slots: ['coreAntiExt'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', clip: 'plank', source: 'R', harder: 'plank-shoulder-taps',
    cues: ['Elbows under shoulders', 'Squeeze glutes, ribs down', 'Breathe without letting the hips sag'],
    whyForRiding: 'A stiff trunk transfers power from legs to board and protects the lower back on landings.',
  },
  {
    id: 'plank-shoulder-taps', name: 'Plank Shoulder Taps', category: 'core', slots: ['coreAntiRot', 'coreAntiExt'],
    equipment: [], needs: ['mat'], difficulty: 2, mode: 'time', clip: 'plankTaps', source: 'R', easier: 'plank',
    cues: ['High plank, feet a little wide', 'Tap the opposite shoulder', 'Hips stay still — no rocking'],
    whyForRiding: 'Anti-rotation strength plus shoulder stability for pushing back up after falls.',
  },
  {
    id: 'hollow-hold', name: 'Hollow Hold', category: 'core', slots: ['coreAntiExt'], equipment: [], needs: ['mat'],
    difficulty: 2, mode: 'time', clip: 'hollowHold', source: 'R', easier: 'dead-bug',
    cues: ['Low back flat on the floor', 'Arms and legs long, hovering', 'Bend knees to make it easier'],
    whyForRiding: 'Gymnast-style core tension for tucks, presses and spins.',
  },
  {
    id: 'bird-dog', name: 'Bird Dog', category: 'core', slots: ['posterior', 'coreAntiRot'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'time', clip: 'birdDog', source: 'R',
    cues: ['On all fours, back flat', 'Reach opposite arm and leg long', 'Pause, then switch sides'],
    whyForRiding: 'Cross-body stability for your back — key for staying balanced on uneven snow.',
  },
  {
    id: 'bear-crawl', name: 'Bear Crawl', category: 'core', slots: ['coreAntiExt', 'warmup'], equipment: [], needs: ['space'],
    difficulty: 2, mode: 'time', clip: 'bearCrawl', source: 'BUR',
    cues: ['Knees hover an inch off the floor', 'Move opposite hand and foot together', 'Small, controlled steps forward and back'],
    whyForRiding: 'Builds wrist, shoulder and hip resilience — the muscles you use to tuck, roll and recover.',
  },
  {
    id: 'glute-bridge', name: 'Glute Bridge', category: 'core', slots: ['posterior', 'hinge'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'reps', clip: 'gluteBridge', source: 'R', harder: 'single-leg-bridge',
    cues: ['Feet flat, close to the glutes', 'Drive through heels, squeeze at the top', 'Ribs down — don’t arch the back'],
    whyForRiding: 'Strong glutes keep your knees tracking over your toes and protect against knee injuries.',
  },
  {
    id: 'bridge-arm-press', name: 'Bridge with Arm Press', category: 'core', slots: ['posterior'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'reps', clip: 'bridgeArmPress', source: 'MD-30',
    cues: ['Lift into a bridge', 'Press both arms up to the ceiling', 'Lower with control'],
    whyForRiding: 'Links glutes, core and shoulders — the chain you use to stand up from heel-side.',
  },
  {
    id: 'single-leg-bridge', name: 'Single-Leg Glute Bridge', category: 'core', slots: ['posterior', 'hinge'], equipment: [],
    needs: ['mat'], difficulty: 2, mode: 'reps', perSide: true, clip: 'slBridge', source: 'R', easier: 'glute-bridge',
    cues: ['One foot planted, other knee up', 'Drive the hips level', 'Don’t let the hip drop'],
    whyForRiding: 'Single-leg hip strength for one-footing off lifts and landing switch.',
  },
  {
    id: 'reverse-snow-angels', name: 'Reverse Snow Angels', category: 'core', slots: ['posterior', 'pull'], equipment: [],
    needs: ['mat'], difficulty: 1, mode: 'reps', clip: 'snowAngels', source: 'BUR',
    cues: ['Face down, chest lifted slightly', 'Sweep arms from hips to overhead', 'Squeeze glutes the whole time'],
    whyForRiding: 'Wakes up the posterior chain for better posture, shoulder mobility and fall resilience.',
  },
  {
    id: 'superman-pull', name: 'Superman Pulls', category: 'core', slots: ['pull', 'posterior'], equipment: [], needs: ['mat'],
    difficulty: 1, mode: 'reps', clip: 'supermanPull', source: 'R',
    cues: ['Face down, arms overhead, chest up', 'Pull elbows down to the ribs', 'Squeeze shoulder blades together'],
    whyForRiding: 'Back strength without equipment, balancing all the pushing you do off the snow.',
  },
  {
    id: 'pallof-press', name: 'Pallof Press', category: 'core', slots: ['coreAntiRot'], equipment: ['bands', 'straps'],
    difficulty: 1, mode: 'reps', perSide: true, clip: 'pallofPress', source: 'R',
    cues: ['Stand side-on to the anchor', 'Press hands straight out from the chest', 'Don’t let the band twist you'],
    whyForRiding: 'Resisting rotation is exactly what your core does when the board catches an edge.',
  },
  {
    id: 'russian-twist', name: 'Russian Twist', category: 'core', slots: ['coreRot'], equipment: [], needs: ['mat'],
    difficulty: 2, mode: 'time', clip: 'russianTwist', source: 'R',
    cues: ['Lean back, chest proud', 'Rotate from the ribs, not the arms', 'Feet down to make it easier'],
    whyForRiding: 'Rotational power for spins and initiating turns.',
  },
  {
    id: 'weighted-russian-twist', name: 'Weighted Russian Twist', category: 'core', slots: ['coreRot'], equipment: KB,
    needs: ['mat'], difficulty: 2, mode: 'time', clip: 'russianTwist', source: 'R', easier: 'russian-twist',
    cues: ['Hold the weight at the chest', 'Rotate side to side under control', 'Keep the spine long'],
    whyForRiding: 'Loaded rotation builds the torque behind 180s and 360s.',
  },
  {
    id: 'windshield-wipers', name: 'Bent-Knee Windshield Wipers', category: 'core', slots: ['coreRot'], equipment: [],
    needs: ['mat'], difficulty: 1, mode: 'time', clip: 'windshieldWipers', source: 'R', harder: 'russian-twist',
    cues: ['Lie on your back, knees up at 90°', 'Lower both knees to one side', 'Shoulders stay glued to the floor'],
    whyForRiding: 'Controlled rotation through the trunk — the base of every turn and spin.',
  },
  {
    id: 'kb-halo', name: 'Halo', category: 'core', slots: ['coreRot', 'mobility'], equipment: KB, difficulty: 1,
    mode: 'time', clip: 'halo', source: 'R',
    cues: ['Hold the weight upside-down at the chest', 'Circle it tight around the head', 'Ribs down, glutes tight'],
    whyForRiding: 'Shoulder mobility plus core bracing — great prep for arms-up balance.',
  },
  {
    id: 'suitcase-march', name: 'Suitcase March', category: 'core', slots: ['coreAntiRot'], equipment: KB, difficulty: 1,
    mode: 'time', perSide: true, clip: 'suitcaseMarch', source: 'R',
    cues: ['Weight in one hand at your side', 'March knees up slowly', 'Stay tall — don’t lean'],
    whyForRiding: 'Side-to-side core stability for one-footing and riding with a lopsided load.',
  },
  {
    id: 'strap-knee-tuck', name: 'Strap Knee Tucks', category: 'core', slots: ['coreAntiExt'], equipment: ['straps'],
    difficulty: 2, mode: 'reps', clip: 'strapKneeTuck', source: 'R',
    cues: ['Feet in the straps, high plank', 'Pull knees to the chest', 'Extend back to a straight plank'],
    whyForRiding: 'Builds the tuck strength you need to absorb rollers and pop off jumps.',
  },
  {
    id: 'copenhagen-plank', name: 'Copenhagen Plank', category: 'core', slots: ['coreAntiRot'], equipment: [],
    needs: ['chair'], difficulty: 3, mode: 'time', perSide: true, clip: 'copenhagen', source: 'R', easier: 'side-plank',
    cues: ['Top leg on a chair, bottom leg hovering', 'Lift hips in a straight line', 'Bend the top knee to make it easier'],
    whyForRiding: 'Bulletproofs the groin and inner thighs, which strain easily when you catch an edge.',
  },

  // ───────────── Lower-body strength ─────────────
  {
    id: 'bodyweight-squat', name: 'Bodyweight Squat', category: 'strength', slots: ['squat'], equipment: [], difficulty: 1,
    mode: 'reps', clip: 'squat', source: 'R', harder: 'eccentric-squat',
    cues: ['Feet shoulder-width, toes slightly out', 'Sit back and down, chest up', 'Knees track over toes'],
    whyForRiding: 'The foundation of a strong riding stance.',
  },
  {
    id: 'goblet-squat', name: 'Goblet Squat', category: 'strength', slots: ['squat'], equipment: KB, difficulty: 1,
    mode: 'reps', clip: 'squat', source: 'MD-HIIT',
    cues: ['Hold the weight at the chest', 'Elbows inside the knees at the bottom', 'Drive up through the whole foot'],
    whyForRiding: 'Loaded squats build quads that can handle a full day of carving.',
  },
  {
    id: 'eccentric-squat', name: 'Eccentric Squat (5s Down)', category: 'strength', slots: ['squat'], equipment: [],
    difficulty: 2, mode: 'reps', secPerRep: 6.5, clip: 'squatSlow', source: 'MD-HIIT', easier: 'bodyweight-squat',
    cues: ['Lower for a slow 5-count', 'Stay in control at the bottom', 'Stand up with normal speed'],
    whyForRiding: 'Riding is mostly eccentric work — absorbing terrain. Slow lowering builds exactly that.',
  },
  {
    id: 'stance-squat', name: 'Stance Squat', category: 'strength', slots: ['squat'], equipment: [], difficulty: 1,
    mode: 'reps', clip: 'stanceSquat', source: 'R',
    cues: ['Feet at your snowboard stance width', 'Squat with arms out in riding position', 'Stay balanced over the middle'],
    whyForRiding: 'Builds strength in the exact position you ride in.',
  },
  {
    id: 'squat-reverse-lunge', name: 'Squat to Reverse Lunge', category: 'strength', slots: ['squat', 'lunge'], equipment: [],
    difficulty: 2, mode: 'reps', secPerRep: 4.5, clip: 'squatReverseLunge', source: 'MD-HIIT',
    cues: ['Squat, stand, then step back into a lunge', 'Alternate the lunging leg', 'Back knee kisses the floor softly'],
    whyForRiding: 'Combines two-leg and split-stance strength for transitions between toe- and heel-side.',
  },
  {
    id: 'reverse-lunge', name: 'Reverse Lunge', category: 'strength', slots: ['lunge'], equipment: [], difficulty: 1,
    mode: 'reps', repScale: 1.5, clip: 'reverseLunge', source: 'R',
    cues: ['Step back, drop the back knee', 'Front shin stays vertical', 'Push through the front heel to stand'],
    whyForRiding: 'Split-stance strength and balance for an uneven, staggered riding stance.',
  },
  {
    id: 'lateral-lunge', name: 'Side Lunge', category: 'strength', slots: ['lunge'], equipment: [], difficulty: 1,
    mode: 'reps', repScale: 1.5, clip: 'lateralLunge', source: 'SA',
    cues: ['Big step to the side', 'Sit into that hip, other leg straight', 'Push back to center'],
    whyForRiding: 'Lateral strength for sideways forces — every turn is a side load.',
  },
  {
    id: 'lateral-lunge-pass', name: 'Lateral Lunge Pass-Through', category: 'strength', slots: ['lunge'], equipment: KB,
    difficulty: 2, mode: 'reps', repScale: 1.5, secPerRep: 3.5, clip: 'lateralLunge', source: 'MD-HIIT', easier: 'lateral-lunge',
    cues: ['Lunge to the side holding the weight', 'Pass it under the bent knee', 'Switch hands as you change sides'],
    whyForRiding: 'Loaded lateral lunges strengthen adductors and glutes for holding edges.',
  },
  {
    id: 'sl-squat-chair', name: 'Single-Leg Squat to Chair', category: 'strength', slots: ['singleLeg'], equipment: [],
    needs: ['chair'], difficulty: 2, mode: 'reps', perSide: true, clip: 'slSquatChair', source: 'SA', harder: 'pistol-squat',
    cues: ['Stand on one leg in front of a chair', 'Sit back slowly until you touch', 'Stand without rocking'],
    whyForRiding: 'Single-leg control for landings, one-footing and knee protection.',
  },
  {
    id: 'strap-pistol', name: 'Strap-Assisted Pistol Squat', category: 'strength', slots: ['singleLeg'], equipment: ['straps'],
    difficulty: 2, mode: 'reps', perSide: true, clip: 'strapPistol', source: 'R', harder: 'pistol-squat',
    cues: ['Hold the straps, one leg forward', 'Sink as low as you control', 'Use the arms only as needed'],
    whyForRiding: 'Builds deep single-leg strength safely — big carry-over to landings.',
  },
  {
    id: 'pistol-squat', name: 'Pistol Squat', category: 'strength', slots: ['singleLeg'], equipment: [], difficulty: 3,
    mode: 'reps', perSide: true, clip: 'pistol', source: 'R', easier: 'sl-squat-chair',
    cues: ['Free leg straight in front', 'Arms forward to counterbalance', 'Heel stays down the whole way'],
    whyForRiding: 'Elite single-leg strength and balance for big landings.',
  },
  {
    id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'strength', slots: ['singleLeg', 'lunge'],
    equipment: [], needs: ['chair'], difficulty: 2, mode: 'reps', perSide: true, clip: 'bulgarian', source: 'R',
    cues: ['Back foot on a chair', 'Drop straight down', 'Front knee over the middle of the foot'],
    whyForRiding: 'Unilateral leg strength that evens out your front-foot / back-foot imbalance.',
  },
  {
    id: 'weighted-bulgarian', name: 'Weighted Bulgarian Split Squat', category: 'strength', slots: ['singleLeg', 'lunge'],
    equipment: KB, needs: ['chair'], difficulty: 3, mode: 'reps', perSide: true, clip: 'bulgarian', source: 'R',
    easier: 'bulgarian-split-squat',
    cues: ['Hold the weight at the chest', 'Control the lowering', 'Drive up through the front heel'],
    whyForRiding: 'Heavy single-leg work for powerful pops and solid landings.',
  },
  {
    id: 'sl-rdl', name: 'Single-Leg RDL', category: 'strength', slots: ['hinge', 'balance'], equipment: [], difficulty: 2,
    mode: 'reps', perSide: true, secPerRep: 3.5, clip: 'slRdl', source: 'MD-30', easier: 'good-morning',
    cues: ['Soft standing knee', 'Hinge forward, back leg reaches long', 'Hips stay square to the floor'],
    whyForRiding: 'Hamstrings and glutes protect the knee, and the balance challenge mirrors riding on one edge.',
  },
  {
    id: 'weighted-sl-rdl', name: 'Weighted Single-Leg RDL', category: 'strength', slots: ['hinge', 'balance'], equipment: KB,
    difficulty: 2, mode: 'reps', perSide: true, secPerRep: 3.5, clip: 'slRdl', source: 'MD-30', easier: 'sl-rdl',
    cues: ['Weight in the opposite hand', 'Hinge until you feel the hamstring', 'Stand tall and squeeze'],
    whyForRiding: 'Loaded posterior chain plus balance — a PT favorite for snowboard knees.',
  },
  {
    id: 'calf-raise-rdl', name: 'Calf Raise to Single-Leg Deadlift', category: 'strength', slots: ['hinge', 'balance', 'calf'],
    equipment: [], difficulty: 2, mode: 'reps', perSide: true, secPerRep: 4, clip: 'calfRaiseRdl', source: 'SA',
    cues: ['Rise onto the toes on one leg', 'Lower and hinge into a deadlift', 'Return tall without touching down'],
    whyForRiding: 'Ankle, hip and balance in one flow — exactly what fine edge control needs.',
  },
  {
    id: 'soleus-raise', name: 'Soleus Calf Raise', category: 'strength', slots: ['calf'], equipment: [], difficulty: 1,
    mode: 'reps', clip: 'soleusRaise', source: 'MD-30', harder: 'calf-raise',
    cues: ['Knees bent like your riding stance', 'Rise high onto the toes', 'Lower slowly'],
    whyForRiding: 'The soleus works in bent-knee positions — like every second you spend in your boots.',
  },
  {
    id: 'calf-raise', name: 'Single-Leg Calf Raise', category: 'strength', slots: ['calf'], equipment: [], difficulty: 2,
    mode: 'reps', perSide: true, clip: 'calfRaise', source: 'R', easier: 'soleus-raise',
    cues: ['On one foot, light hand on a wall', 'Full rise, full lower', 'No bouncing'],
    whyForRiding: 'Strong calves and ankles for toe-side turns and stable landings.',
  },
  {
    id: 'offset-thruster', name: 'Offset Thruster', category: 'strength', slots: ['squat', 'push'], equipment: KB,
    difficulty: 2, mode: 'reps', perSide: true, secPerRep: 3.5, clip: 'thruster', source: 'MD-30',
    cues: ['Weight racked on one shoulder', 'Squat, then drive it overhead', 'Resist leaning to the loaded side'],
    whyForRiding: 'Full-body power with an anti-lean core challenge, like riding with uneven pressure.',
  },
  {
    id: 'good-morning', name: 'Good Morning', category: 'strength', slots: ['hinge'], equipment: [], difficulty: 1,
    mode: 'reps', clip: 'goodMorning', source: 'MD-HIIT', harder: 'sl-rdl',
    cues: ['Hands behind the head', 'Push hips back, flat back', 'Squeeze glutes to stand'],
    whyForRiding: 'Teaches a strong hip hinge — your safest position for absorbing bumps.',
  },
  {
    id: 'kb-good-morning', name: 'Weighted Good Morning', category: 'strength', slots: ['hinge'], equipment: KB,
    difficulty: 2, mode: 'reps', clip: 'goodMorning', source: 'MD-HIIT', easier: 'good-morning',
    cues: ['Hug the weight at your chest', 'Hinge until the hamstrings stretch', 'Drive the hips through'],
    whyForRiding: 'Loaded hinge strength for a resilient lower back on long days.',
  },
  {
    id: 'kb-swing', name: 'Kettlebell Swing', category: 'strength', slots: ['hinge', 'cardio'], equipment: KB, difficulty: 2,
    mode: 'reps', secPerRep: 2, clip: 'kbSwing', source: 'R',
    cues: ['Hike the weight back between the legs', 'Snap the hips forward', 'Let it float to chest height'],
    whyForRiding: 'Explosive hip power for ollies and pops, and it’s great conditioning.',
  },
  {
    id: 'wall-sit', name: 'Stance Wall Sit', category: 'strength', slots: ['squat'], equipment: [], needs: ['wall'],
    difficulty: 1, mode: 'time', clip: 'wallSit', source: 'R',
    cues: ['Back flat on the wall', 'Thighs near parallel', 'Arms out like you’re riding'],
    whyForRiding: 'The classic snowboard burn — builds the leg endurance to ride top-to-bottom without stopping.',
  },
  {
    id: 'band-walk', name: 'Banded Lateral Walk', category: 'strength', slots: ['lunge', 'posterior'], equipment: ['bands'],
    difficulty: 1, mode: 'time', clip: 'bandWalk', source: 'R',
    cues: ['Band above the knees', 'Quarter squat, step sideways', 'Never let the knees cave in'],
    whyForRiding: 'Glute med strength keeps the knees out — key to protecting your ACL.',
  },
  {
    id: 'strap-ham-curl', name: 'Strap Hamstring Curl', category: 'strength', slots: ['hinge', 'posterior'],
    equipment: ['straps'], difficulty: 2, mode: 'reps', clip: 'strapHamCurl', source: 'R',
    cues: ['Heels in the straps, lie on your back', 'Lift the hips and curl the heels in', 'Extend slowly'],
    whyForRiding: 'Hamstrings act as a natural ACL — strong ones protect your knees on hard landings.',
  },
  {
    id: 'step-up', name: 'Step-Up', category: 'strength', slots: ['singleLeg'], equipment: [], needs: ['chair'],
    difficulty: 1, mode: 'reps', perSide: true, clip: 'stepUp', source: 'R', harder: 'sl-squat-chair',
    cues: ['Whole foot on a sturdy step', 'Drive up through that heel', 'Lower slowly — don’t drop'],
    whyForRiding: 'Single-leg drive for skating to the lift and hiking park features.',
  },
  {
    id: 'skater-squat', name: 'Skater Squat', category: 'strength', slots: ['singleLeg'], equipment: [], difficulty: 3,
    mode: 'reps', perSide: true, clip: 'skaterSquat', source: 'R', easier: 'sl-squat-chair',
    cues: ['Stand on one leg, other leg behind', 'Lower until the back knee nearly touches', 'Lean forward slightly, arms reach'],
    whyForRiding: 'Advanced single-leg strength with a forward lean — like absorbing a landing.',
  },

  // ───────────── Upper body / fall-proofing ─────────────
  {
    id: 'incline-push-up', name: 'Incline Push-Up', category: 'upper', slots: ['push'], equipment: [], needs: ['chair'],
    difficulty: 1, mode: 'reps', clip: 'inclinePushUp', source: 'R', harder: 'push-up',
    cues: ['Hands on a sturdy chair or bench', 'Body in one straight line', 'Lower chest to the edge'],
    whyForRiding: 'Builds the pushing strength to get back up — and to brace a fall safely.',
  },
  {
    id: 'push-up', name: 'Push-Up', category: 'upper', slots: ['push'], equipment: [], difficulty: 2, mode: 'reps',
    clip: 'pushUp', source: 'R', easier: 'incline-push-up', harder: 'pike-push-up',
    cues: ['Hands under shoulders', 'Elbows at about 45°', 'Chest to the floor, body rigid'],
    whyForRiding: 'Strong chest, shoulders and triceps reduce wrist and shoulder injuries in falls.',
  },
  {
    id: 'wrist-push-up', name: 'Wrist Push-Up', category: 'upper', slots: ['push'], equipment: [], needs: ['mat'],
    difficulty: 2, mode: 'reps', clip: 'pushUp', source: 'BUR', easier: 'incline-push-up',
    cues: ['Backs of the hands on the floor, fingers toward knees', 'Lower slowly, core tight', 'Drop to the knees to make it easier'],
    whyForRiding: 'Strengthens wrists for the instinctive hand-down when you catch an edge.',
  },
  {
    id: 'pike-push-up', name: 'Pike Push-Up', category: 'upper', slots: ['push'], equipment: [], difficulty: 3,
    mode: 'reps', clip: 'pikePushUp', source: 'R', easier: 'push-up',
    cues: ['Hips high in an upside-down V', 'Lower the head between the hands', 'Press back up through the shoulders'],
    whyForRiding: 'Overhead shoulder strength for safer falls and pushing out of deep snow.',
  },
  {
    id: 'chair-dips', name: 'Chair Dips', category: 'upper', slots: ['push'], equipment: [], needs: ['chair'],
    difficulty: 1, mode: 'reps', clip: 'chairDip', source: 'R',
    cues: ['Hands on the chair edge behind you', 'Bend the elbows straight back', 'Keep shoulders down, away from ears'],
    whyForRiding: 'Triceps strength for pushing up from heel-side after a fall.',
  },
  {
    id: 'strap-row', name: 'Strap Row', category: 'upper', slots: ['pull'], equipment: ['straps'], difficulty: 1,
    mode: 'reps', clip: 'strapRow', source: 'R',
    cues: ['Lean back, body straight', 'Pull the chest to the hands', 'Squeeze shoulder blades together'],
    whyForRiding: 'Upper-back strength for posture and shoulder health.',
  },
  {
    id: 'band-row', name: 'Band Row', category: 'upper', slots: ['pull'], equipment: ['bands'], difficulty: 1, mode: 'reps',
    clip: 'bandRow', source: 'R',
    cues: ['Band anchored at chest height', 'Pull elbows back past the ribs', 'Control the return'],
    whyForRiding: 'Balances out pushing muscles and keeps shoulders stable.',
  },
  {
    id: 'kb-row', name: 'Bent-Over Row', category: 'upper', slots: ['pull'], equipment: KB, difficulty: 1, mode: 'reps',
    perSide: true, clip: 'kbRow', source: 'R',
    cues: ['Hinge forward, flat back', 'Row the weight to the hip', 'Don’t twist the torso'],
    whyForRiding: 'Back strength plus a strong hinge — your posture for long riding days.',
  },
  {
    id: 'band-pull-apart', name: 'Band Pull-Apart', category: 'upper', slots: ['pull'], equipment: ['bands'], difficulty: 1,
    mode: 'reps', secPerRep: 2.5, clip: 'pullApart', source: 'R',
    cues: ['Arms straight in front', 'Pull the band to the chest', 'Squeeze between the shoulder blades'],
    whyForRiding: 'Rotator cuff and upper-back health — shoulders are a top snowboard injury.',
  },

  // ───────────── Balance ─────────────
  {
    id: 'sl-balance', name: 'Single-Leg Balance', category: 'balance', slots: ['balance'], equipment: [], difficulty: 1,
    mode: 'time', perSide: true, clip: 'slBalance', source: 'SA', harder: 'sl-balance-eyes-closed',
    cues: ['Stand tall on one foot', 'Soft knee, grip the floor with the toes', 'Eyes on a fixed point'],
    whyForRiding: 'Ankle proprioception — your body’s sense of where the board is under you.',
  },
  {
    id: 'sl-balance-eyes-closed', name: 'Eyes-Closed Balance', category: 'balance', slots: ['balance'], equipment: [],
    difficulty: 2, mode: 'time', perSide: true, clip: 'slBalance', source: 'SA', easier: 'sl-balance',
    cues: ['Find your balance, then close the eyes', 'Small ankle corrections only', 'Open the eyes if you need to reset'],
    whyForRiding: 'Trains balance without vision — like riding in flat light or a whiteout.',
  },
  {
    id: 'sl-clock-reach', name: 'Single-Leg Clock Reach', category: 'balance', slots: ['balance'], equipment: [],
    difficulty: 2, mode: 'reps', perSide: true, secPerRep: 3.5, clip: 'slReach', source: 'SA',
    cues: ['Balance on one leg, soft knee', 'Tap the free foot forward, side, back', 'Return to center each time'],
    whyForRiding: 'Dynamic balance in every direction — the board moves in all of them.',
  },
  {
    id: 'rdl-high-knee', name: 'Single-Leg Deadlift to High Knee', category: 'balance', slots: ['balance', 'hinge'],
    equipment: [], difficulty: 2, mode: 'reps', perSide: true, secPerRep: 3.5, clip: 'rdlHighKnee', source: 'R',
    cues: ['Hinge on one leg', 'Drive up into a high knee', 'Hold the top for a beat'],
    whyForRiding: 'Hinge, balance and drive in one move. It mimics recovering from a landing.',
  },
  {
    id: 'board-stance', name: 'Balance Board Stance Hold', category: 'balance', slots: ['balance'], equipment: ['balanceBoard'],
    difficulty: 1, mode: 'time', clip: 'boardStance', source: 'R', harder: 'board-squat',
    cues: ['Feet at stance width over the roller', 'Knees soft, arms relaxed', 'Keep the edges off the floor'],
    whyForRiding: 'The closest thing to riding you can do at home.',
  },
  {
    id: 'board-squat', name: 'Balance Board Squats', category: 'balance', slots: ['balance', 'squat'],
    equipment: ['balanceBoard'], difficulty: 2, mode: 'reps', secPerRep: 3.5, clip: 'boardSquat', source: 'R',
    easier: 'board-stance',
    cues: ['Find balance first', 'Squat slowly, keep the board level', 'Rise without wobbling'],
    whyForRiding: 'Strength under instability — exactly what variable snow demands.',
  },

  // ───────────── Plyometrics / landing ─────────────
  {
    id: 'drop-squat', name: 'Drop Squat & Stick', category: 'plyo', slots: ['plyo'], equipment: [], difficulty: 1,
    mode: 'reps', secPerRep: 2.5, clip: 'dropSquat', source: 'R',
    cues: ['Stand tall, then drop fast into a quarter squat', 'Land quiet, knees out', 'Freeze for a beat'],
    whyForRiding: 'Teaches your landing position: fast, stable and absorbing.',
  },
  {
    id: 'line-hops', name: 'Lateral Line Hops', category: 'plyo', slots: ['plyo', 'cardio'], equipment: [], difficulty: 1,
    mode: 'time', impact: true, clip: 'lineHops', source: 'R',
    cues: ['Feet together, hop side to side', 'Stay on the balls of the feet', 'Quick and light'],
    whyForRiding: 'Quick edge-to-edge feet for tight trees and moguls.',
  },
  {
    id: 'jump-squat', name: 'Jump Squat', category: 'plyo', slots: ['plyo'], equipment: [], difficulty: 2, mode: 'reps',
    secPerRep: 2.5, impact: true, clip: 'jumpSquat', source: 'R', easier: 'drop-squat', harder: 'tuck-jump',
    cues: ['Squat, then explode up', 'Land soft back into the squat', 'Knees track over the toes'],
    whyForRiding: 'Explosive legs for pops and absorbing landings.',
  },
  {
    id: 'ollie-jumps', name: 'Ollie Jumps', category: 'plyo', slots: ['plyo'], equipment: [], difficulty: 2, mode: 'reps',
    secPerRep: 2.5, impact: true, clip: 'ollie', source: 'R',
    cues: ['Shift weight to the back foot', 'Spring off the back leg, front knee up first', 'Land on both feet softly'],
    whyForRiding: 'Rehearses the exact pop pattern of an ollie.',
  },
  {
    id: 'jump-180', name: '180 Jumps', category: 'plyo', slots: ['plyo'], equipment: [], needs: ['space'], difficulty: 2,
    mode: 'reps', secPerRep: 2.5, impact: true, clip: 'jump180', source: 'SA',
    cues: ['Wind up the arms', 'Jump and spin half a turn', 'Stick the landing in your stance'],
    whyForRiding: 'Rotational power and landing control for spins and switch riding.',
  },
  {
    id: 'sl-hops', name: 'Single-Leg Hops', category: 'plyo', slots: ['plyo'], equipment: [], difficulty: 2, mode: 'time',
    perSide: true, impact: true, clip: 'slHops', source: 'SA',
    cues: ['Small hops on one foot', 'Land soft, knee over the toes', 'Stay tall through the core'],
    whyForRiding: 'Reactive ankle and knee stability for chattery, uneven snow.',
  },
  {
    id: 'sl-broad-jump', name: 'Single-Leg Broad Jump', category: 'plyo', slots: ['plyo'], equipment: [], needs: ['space'],
    difficulty: 3, mode: 'reps', perSide: true, secPerRep: 4, impact: true, clip: 'broadJumpSL', source: 'SA',
    easier: 'sl-hops',
    cues: ['Load the hip on one leg', 'Jump forward and land on the same leg', 'Stick it for two seconds'],
    whyForRiding: 'Single-leg landing strength for when things go sideways.',
  },
  {
    id: 'skater-bounds', name: 'Skater Bounds', category: 'plyo', slots: ['plyo', 'cardio'], equipment: [], needs: ['space'],
    difficulty: 2, mode: 'time', impact: true, clip: 'skaterBound', source: 'R',
    cues: ['Bound sideways onto one foot', 'Free leg sweeps behind', 'Stick briefly, then bound back'],
    whyForRiding: 'Lateral power and single-leg landings — edge-to-edge strength.',
  },
  {
    id: 'tuck-jump', name: 'Tuck Jumps', category: 'plyo', slots: ['plyo'], equipment: [], difficulty: 3, mode: 'reps',
    secPerRep: 2.5, impact: true, clip: 'tuckJump', source: 'R', easier: 'jump-squat',
    cues: ['Jump high, pull knees to the chest', 'Land soft and reset', 'Quality over speed'],
    whyForRiding: 'Builds the tuck you use to grab and absorb kickers.',
  },

  // ───────────── Conditioning ─────────────
  {
    id: 'mountain-climbers', name: 'Mountain Climbers', category: 'cardio', slots: ['cardio', 'coreAntiExt'], equipment: [],
    difficulty: 1, mode: 'time', clip: 'mountainClimber', source: 'R',
    cues: ['High plank, shoulders over wrists', 'Drive the knees in fast', 'Hips stay low'],
    whyForRiding: 'Cardio plus core — for hiking park features and long runs.',
  },
  {
    id: 'step-back-burpee', name: 'Step-Back Burpee', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 1,
    mode: 'time', clip: 'burpeeStep', source: 'R', harder: 'burpee',
    cues: ['Hands down, step back to a plank', 'Step the feet in', 'Stand up tall'],
    whyForRiding: 'Practice getting up off the snow fast — over and over.',
  },
  {
    id: 'burpee', name: 'Burpee', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 2, mode: 'time',
    impact: true, clip: 'burpee', source: 'R', easier: 'step-back-burpee',
    cues: ['Drop to a plank', 'Jump the feet in', 'Explode up with a jump'],
    whyForRiding: 'The ultimate get-up-after-a-fall conditioner.',
  },
  {
    id: 'high-knees', name: 'High Knees', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 1, mode: 'time',
    impact: true, clip: 'highKnees', source: 'R',
    cues: ['Drive the knees to hip height', 'Pump the arms', 'Stay light on the feet'],
    whyForRiding: 'Builds the aerobic engine for full days on the mountain.',
  },
  {
    id: 'squat-jacks', name: 'Squat Jacks', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 2,
    mode: 'time', impact: true, clip: 'squatJacks', source: 'R',
    cues: ['Stay low in a squat', 'Jump the feet wide and back in', 'Chest up, arms in riding position'],
    whyForRiding: 'Leg endurance in a crouched position — like a long run of powder.',
  },
  {
    id: 'jump-rope', name: 'Jump Rope', category: 'cardio', slots: ['cardio'], equipment: ['jumpRope'], difficulty: 1,
    mode: 'time', impact: true, clip: 'jumpRope', source: 'R',
    cues: ['Small hops on the balls of the feet', 'Turn the rope from the wrists', 'Elbows close to the body'],
    whyForRiding: 'Springy ankles and great cardio in a tiny space.',
  },
  {
    id: 'skater-steps', name: 'Skater Steps', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 1,
    mode: 'time', clip: 'skaterStep', source: 'R', harder: 'skater-bounds',
    cues: ['Big step to the side, sweep the other leg behind', 'Stay low like you’re skating to the lift', 'Swing the arms across'],
    whyForRiding: 'Low-impact lateral cardio that mimics skating in the lift line.',
  },
  {
    id: 'step-jacks', name: 'Step Jacks', category: 'cardio', slots: ['cardio', 'warmup'], equipment: [], difficulty: 1,
    mode: 'time', clip: 'stepJacks', source: 'R', harder: 'jumping-jacks',
    cues: ['Step one foot out as the arms go up', 'Step back in and switch sides', 'Keep a brisk rhythm'],
    whyForRiding: 'Joint-friendly cardio to build your engine without the pounding.',
  },
  {
    id: 'butt-kicks', name: 'Butt Kicks', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 1, mode: 'time',
    impact: true, clip: 'buttKicks', source: 'R',
    cues: ['Jog in place', 'Kick the heels up to the glutes', 'Quick, light contacts'],
    whyForRiding: 'Warms up hamstrings and adds quick cardio for long hikes.',
  },
  {
    id: 'fast-feet', name: 'Fast Feet', category: 'cardio', slots: ['cardio'], equipment: [], difficulty: 1, mode: 'time',
    clip: 'fastFeet', source: 'R',
    cues: ['Athletic stance, weight on the balls of the feet', 'Tiny, rapid steps', 'Keep the chest up'],
    whyForRiding: 'Quick reactions and low-impact cardio.',
  },
  {
    id: 'shadow-carving', name: 'Shadow Carving', category: 'cardio', slots: ['cardio', 'balance'], equipment: [],
    difficulty: 1, mode: 'time', clip: 'shadowCarve', source: 'R',
    cues: ['Riding stance, knees bent', 'Rock to toe edge, then heel edge', 'Lead with the shoulders and hips'],
    whyForRiding: 'Grooves the movement pattern of linking carved turns while building leg endurance.',
  },
]

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export const getExercise = (id: string): Exercise => {
  const ex = EXERCISE_MAP[id]
  if (!ex) throw new Error(`Unknown exercise: ${id}`)
  return ex
}
