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
                    { text: "📝 Safe Journaling", link: "/diary" }
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
                    { text: "📝 New Intentions", link: "/diary" }
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
