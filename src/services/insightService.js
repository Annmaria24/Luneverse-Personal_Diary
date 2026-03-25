import { getDiaryEntries } from './diaryService';
import { getMoodHistory } from './moodService';
import { getCycleData, getCycleStats } from './cycleService';

/**
 * AI-assisted menstrual cycle prediction and emotional wellness system.
 * This service calculates cycle phases, predicts upcoming dates, 
 * and correlates emotional patterns with the menstrual cycle.
 */

// Calculate the cycle phase for a given day offset from period start
export const calculatePhase = (cycleDay, averageCycleLength) => {
    if (cycleDay <= 5) return 'Menstrual';

    // Average ovulation is around 14 days before next period
    const ovulationDay = Math.max(10, averageCycleLength - 14);

    // Fertility window is typically 5 days before ovulation to 1 day after
    const fertStart = ovulationDay - 5;
    const fertEnd = ovulationDay + 1;

    // PMS phase typically starts 7 days before period
    const pmsStart = averageCycleLength - 7;

    if (cycleDay >= pmsStart && cycleDay <= averageCycleLength) {
        return 'PMS';
    } else if (cycleDay > 5 && cycleDay < fertStart) {
        return 'Follicular';
    } else if (cycleDay >= fertStart && cycleDay <= fertEnd) {
        return 'Ovulation';
    } else if (cycleDay > fertEnd && cycleDay < pmsStart) {
        return 'Luteal';
    } else {
        return 'Luteal';
    }
};

/**
 * Generates personalized emotional insights based on cycle data, mood history, and diary entries.
 * Integrates with Relax Module suggestions.
 */
export const getEmotionalInsights = async (userId) => {
    try {
        // 1. Fetch data from integrated modules
        const cycleStats = await getCycleStats(userId);
        const lastPeriodStart = cycleStats.lastPeriodStart ? new Date(cycleStats.lastPeriodStart) : null;
        const avgLength = cycleStats.averageCycleLength || 28;

        // Fallback if no period logged yet
        if (!lastPeriodStart) {
            return {
                hasData: false,
                message: "Log your first period to start receiving personalized cycle and emotional insights."
            };
        }

        const today = new Date();
        const diffTime = today - lastPeriodStart;
        const currentCycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        let actualCurrentPhase = calculatePhase(currentCycleDay, avgLength);

        // Next period prediction
        const nextPeriod = new Date(lastPeriodStart);
        nextPeriod.setDate(nextPeriod.getDate() + avgLength);
        const daysToPeriod = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

        // Ovulation prediction
        const ovulationDay = Math.max(10, avgLength - 14);
        const ovulationDate = new Date(lastPeriodStart);
        ovulationDate.setDate(ovulationDate.getDate() + ovulationDay - 1);
        const daysToOvulation = Math.ceil((ovulationDate - today) / (1000 * 60 * 60 * 24));

        // 2. Correlation Analysis - use unified emotional dataset
        const { getEmotionalTrendData } = await import('./moodService');
        // We use 'all' to get the full history for trend analysis
        const trendData = await getEmotionalTrendData(userId, 'all');
        const allEmotions = trendData.rawPoints.map(p => ({
            date: p.rawTimestamp,
            mood: (() => {
                const s = p.y;
                if (s < 0.8) return "Sad";
                if (s < 1.8) return "Angry";
                if (s < 2.8) return "Stressed";
                if (s < 3.8) return "Neutral";
                if (s < 4.8) return "Calm";
                return "Happy";
            })()
        }));

        const phaseMoods = {
            'Menstrual': [],
            'Follicular': [],
            'Ovulation': [],
            'Luteal': [],
            'PMS': []
        };

        // Populate phase Moods based on past 90 days to find correlations
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        allEmotions.forEach(e => {
            if (e.date >= ninetyDaysAgo) {
                // Approximate cycle offset for historical dates
                const offset = Math.floor((e.date - lastPeriodStart) / (1000 * 60 * 60 * 24)) % avgLength;
                const normalizedOffset = offset < 0 ? offset + avgLength : offset;
                const ph = calculatePhase(normalizedOffset + 1, avgLength);
                if (phaseMoods[ph]) {
                    phaseMoods[ph].push(e.mood);
                }
            }
        });

        // Identify patterns: Determine predicted mood for current phase based on past history
        let predictedCurrentMood = 'Neutral';
        if (phaseMoods[actualCurrentPhase] && phaseMoods[actualCurrentPhase].length > 0) {
            const counts = {};
            phaseMoods[actualCurrentPhase].forEach(m => {
                const normalized = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
                counts[normalized] = (counts[normalized] || 0) + 1;
            });
            predictedCurrentMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        }

        // 3. Emotional Forecasting & personalized Coping Suggestions
        let forecastingText = "";
        let copingSuggestions = [];
        let quote = "";

        switch (actualCurrentPhase) {
            case 'PMS':
                forecastingText = "You may feel more emotionally sensitive or experience mood dips soon. Be gentle with yourself.";
                copingSuggestions = [
                    { text: "🫧 Calming Breath", link: "/relax?section=breathe" },
                    { text: "📝 Safe Journaling", link: "/my-journal" }
                ];
                quote = "Listen to your body's need for rest.";
                break;
            case 'Menstrual':
                forecastingText = "Energy may be lower right now. Prioritize comfort and rest during your period.";
                copingSuggestions = [
                    { text: "✨ Gentle Affirmations", link: "/relax?section=affirmations" },
                    { text: "🫧 Heartbeat Breath", link: "/relax?section=breathe" }
                ];
                quote = "Give yourself the grace you deserve.";
                break;
            case 'Follicular':
                forecastingText = "Energy and positivity are rising. A fresh perspective is emerging.";
                copingSuggestions = [
                    { text: "🎨 Flow Mode Art", link: "/relax?section=flow" },
                    { text: "📝 New Intentions", link: "/my-journal" }
                ];
                quote = "Embrace your growing vitality.";
                break;
            case 'Ovulation':
                forecastingText = "Social energy and confidence peak now. Perfect for creative and active tasks.";
                copingSuggestions = [
                    { text: "🎨 Creative Flow", link: "/relax?section=flow" },
                    { text: "💭 Daily Quotes", link: "/relax?section=quotes" }
                ];
                quote = "Trust in your bright energy today.";
                break;
            default: // Luteal
                forecastingText = "Steadying energy phase. Focus on balance and a gentle routine.";
                copingSuggestions = [
                    { text: "🫧 Steady Breathing", link: "/relax?section=breathe" },
                    { text: "🌧️ Focus Sounds", link: "/relax?section=sound" }
                ];
                quote = "Stay grounded and take things one step at a time.";
                break;
        }

        // 4. Personalized Reminders
        const reminders = [];
        if (daysToPeriod > 0 && daysToPeriod <= 3) {
            reminders.push(`Your period is expected in ${daysToPeriod} days.`);
        } else if (daysToPeriod === 0) {
            reminders.push("Your period is expected today.");
        } else if (daysToPeriod < 0 && daysToPeriod >= -3) {
            reminders.push(`Your period is slightly late (Day ${Math.abs(daysToPeriod)}).`);
        }

        if (daysToOvulation > 0 && daysToOvulation <= 2) {
            reminders.push(`Ovulation window starts in ${daysToOvulation} days.`);
        } else if (daysToOvulation === 0) {
            reminders.push("Ovulation window is today! Expect peak energy.");
        }

        if (actualCurrentPhase === 'PMS') {
            reminders.push("Possible PMS symptoms: You might feel more tired or sensitive.");
        }

        // Detected mood dip alert based on past patterns
        if (["Angry", "Stressed", "Sad", "Frustrated", "Anxious"].includes(predictedCurrentMood)) {
            reminders.push(`Pattern Insight: Your mood often dips during this phase. Would you like to try a breathing exercise?`);
        }

        return {
            hasData: true,
            currentPhase: actualCurrentPhase,
            cycleDay: currentCycleDay,
            daysToPeriod: daysToPeriod,
            nextPeriodDate: nextPeriod.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ovulationWindow: ovulationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            predictedCurrentMood,
            forecastingText,
            reminders,
            copingSuggestions,
            quote,
            avgCycleLength: avgLength
        };
    } catch (err) {
        console.error("Error generating insights:", err);
        return { hasData: false, message: "Could not generate insights at this time." };
    }
};

/**
 * New Cycle-Aware Emotional Insight function (Context-Aware Narrative)
 * Returns structured supportive insights connecting menstrual cycle to current emotions.
 */
export const getCycleAwareEmotionInsight = async (userId) => {
    try {
        const { getCycleStats } = await import('./cycleService');
        const { getEmotionalTrendData } = await import('./moodService');
        
        // Fetch all necessary data
        const cycleStats = await getCycleStats(userId);
        
        if (!cycleStats || !cycleStats.lastPeriodStart) {
            return {
                hasData: false,
                message: "Log your first period to receive cycle-aware emotional insights."
            };
        }

        // 1. Combine Cycle Phase with Mood Data
        // Fetch last 7 days of pulse/mood data via internal helper for real-time trend
        const trendData = await trendAnalysis(userId, 7);
        const currentPhase = cycleStats.currentPhase; 
        const avgLength = cycleStats.averageCycleLength || 28;
        
        const today = new Date();
        const nextPeriod = new Date(cycleStats.nextPredictedPeriod);
        const daysUntilNextPeriod = Math.max(0, Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24)));

        // Analyze current mood trend direction (improving, stable, declining)
        let moodTrend = 'stable';
        const points = trendData.points;
        if (points.length >= 2) {
            const startScore = points[0].y;
            const endScore = points[points.length - 1].y;
            const diff = endScore - startScore;
            if (diff > 0.45) moodTrend = 'improving';
            else if (diff < -0.45) moodTrend = 'declining';
        }

        // 2. Detect Cycle-Linked Emotional Patterns & 3. Generate Supportive Messages
        let insightType = "general";
        let insightMessage = "Your emotional state is currently moving through your cycle rhythm.";

        // Pattern 1: PMS mood dip
        if ((currentPhase === 'Luteal' || currentPhase === 'PMS') && daysUntilNextPeriod <= 3 && moodTrend === 'declining') {
            insightType = "pms_mood_dip";
            insightMessage = "You seem to be approaching your period, and your mood has dipped slightly. This can be a natural response to hormonal changes. Be gentle with yourself during this time.";
        } 
        // Pattern 2: Post-period emotional recovery
        else if (currentPhase === 'Follicular' && moodTrend === 'improving') {
            insightType = "energy_recovery_phase";
            insightMessage = "Your mood is improving during this phase. You may feel more energetic and mentally clear this week.";
        }
        // Pattern 3: Ovulation positive phase
        else if (currentPhase === 'Ovulation' && (moodTrend === 'stable' || moodTrend === 'improving')) {
            insightType = "high_energy_phase";
            insightMessage = "You may feel more confident and expressive around this phase. It’s a great time to engage in activities you enjoy.";
        }
        // Pattern 4: Cycle-based emotional fluctuation
        else if (moodTrend !== 'stable') {
            insightType = "cycle_linked_variation";
            insightMessage = "Your emotions are fluctuating alongside your hormonal cycle. This is a normal part of your internal rhythm.";
        }
        else if (currentPhase === 'Menstrual') {
            insightMessage = "You’re in your menstrual phase. Rest and self-care are your best companions right now.";
        } else {
             insightMessage = "Steadying energy phase. Focus on balance and a gentle routine.";
        }

        // 4. Period Reminder Integration
        let periodReminder = "";
        if (daysUntilNextPeriod <= 3) {
            periodReminder = daysUntilNextPeriod === 0 
                ? "Your period is expected today." 
                : `Your period is expected in ${daysUntilNextPeriod} day${daysUntilNextPeriod === 1 ? '' : 's'}.`;
        }

        // 5. Predict Future Emotional Tendencies (Pattern Aware)
        // Check recurring patterns over the last 90 days
        const lastPeriodStart = new Date(cycleStats.lastPeriodStart);
        const patterns = await detectRecurringPatterns(userId, lastPeriodStart, avgLength);
        
        let predictedMoodHint = "";
        if (patterns && patterns.hasHistory) {
            if ((currentPhase === 'Luteal' || currentPhase === 'PMS') && patterns.follicularAvg > patterns.lutealAvg + 0.5) {
                predictedMoodHint = "Based on your history, you may feel more positive and energetic in the coming follicular phase.";
            } else if ((currentPhase === 'Luteal' || currentPhase === 'PMS') && patterns.lutealAvg < 2.5) {
                predictedMoodHint = "You often experience a slight mood dip before your period. Preparing for rest may help.";
            } else if (currentPhase === 'Menstrual' && patterns.follicularAvg > 3.5) {
                predictedMoodHint = "Expect your energy and mood to rise significantly as you transition into your follicular phase next week.";
            }
        }

        // Fallback to general phase-based prediction if no specific pattern found
        if (!predictedMoodHint) {
            if (currentPhase === 'Luteal' || currentPhase === 'PMS') {
                predictedMoodHint = "As you enter your follicular phase soon, you may notice a boost in energy and clarity.";
            } else if (currentPhase === 'Menstrual') {
                predictedMoodHint = "Based on your cycle, your mood and physical energy typically begin to rise in a few days.";
            } else if (currentPhase === 'Follicular') {
                predictedMoodHint = "You're heading towards your high-energy ovulation window — a great time for productivity.";
            } else {
                 predictedMoodHint = "Your internal energy is gradually stabilizing as you transition through this phase.";
            }
        }

        // 6. Supportive Coping Suggestions based on Phase + Mood
        let copingSuggestions = [];
        switch (currentPhase) {
            case 'Menstrual':
                copingSuggestions = [
                    { text: "✨ Gentle Affirmations", link: "/relax?section=affirmations" },
                    { text: "🫧 Heartbeat Breath", link: "/relax?section=breathe" }
                ];
                break;
            case 'Follicular':
                copingSuggestions = [
                    { text: "🎨 Flow Mode Art", link: "/relax?section=flow" },
                    { text: "📝 New Intentions", link: "/my-journal" }
                ];
                break;
            case 'Ovulation':
                copingSuggestions = [
                    { text: "🎨 Creative Flow", link: "/relax?section=flow" },
                    { text: "💭 Daily Quotes", link: "/relax?section=quotes" }
                ];
                break;
            case 'Luteal':
            case 'PMS':
            default:
                if (moodTrend === 'declining') {
                    copingSuggestions = [
                        { text: "🫧 Calming Breath", link: "/relax?section=breathe" },
                        { text: "📝 Safe Journaling", link: "/my-journal" }
                    ];
                } else {
                    copingSuggestions = [
                        { text: "🌧️ Focus Sounds", link: "/relax?section=sound" },
                        { text: "🫧 Steady Breathing", link: "/relax?section=breathe" }
                    ];
                }
                break;
        }

        return {
            cyclePhase: currentPhase,
            insightType,
            insightMessage,
            periodReminder,
            predictedMoodHint,
            copingSuggestions,
            cycleDay: cycleStats.currentCycleDay,
            hasData: true
        };

    } catch (err) {
        console.error("Error in getCycleAwareEmotionInsight:", err);
        return { hasData: false, message: "Could not correlate cycle and mood data." };
    }
};

/**
 * Internal helper to detect recurring emotional patterns across cycle phases
 */
const detectRecurringPatterns = async (userId, lastPeriodStart, avgLength) => {
    try {
        const { getEmotionalTrendData } = await import('./moodService');
        // Fetch all history to analyze last 3 months
        const trendData = await getEmotionalTrendData(userId, 'all');
        const points = trendData.rawPoints || [];
        
        if (points.length < 5) return null; // Not enough data for patterns

        const limit = new Date();
        limit.setDate(limit.getDate() - 90);
        
        const phaseScores = { Menstrual: [], Follicular: [], Ovulation: [], Luteal: [] };
        
        points.forEach(p => {
            if (p.rawTimestamp >= limit) {
                const dayDiff = Math.floor((p.rawTimestamp - lastPeriodStart) / (1000 * 60 * 60 * 24));
                const offset = ((dayDiff % avgLength) + avgLength) % avgLength;
                const ph = calculatePhase(offset + 1, avgLength);
                if (phaseScores[ph]) phaseScores[ph].push(p.y);
            }
        });

        const getAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        
        return {
            hasHistory: true,
            follicularAvg: getAvg(phaseScores.Follicular || []),
            lutealAvg: getAvg(phaseScores.Luteal || []),
            ovulationAvg: getAvg(phaseScores.Ovulation || []),
            menstrualAvg: getAvg(phaseScores.Menstrual || [])
        };
    } catch (e) {
        return null;
    }
};

/**
 * Internal helper for analyzing mood trends over a period
 */
const trendAnalysis = async (userId, days) => {
    try {
        const { getEmotionalTrendData } = await import('./moodService');
        // 'week' view in moodService provides a 7-day aggregated dataset
        const trendData = await getEmotionalTrendData(userId, 'week'); 
        return {
            points: trendData.rawPoints || [],
            total: trendData.totalEntries || 0
        };
    } catch (e) {
        return { points: [], total: 0 };
    }
};
