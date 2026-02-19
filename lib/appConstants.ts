

export function appConstants() {
    return {
        js_kit_price: 149,
        complete_kit_price: 299,
        experiences_kit_price: 299,
        react_kit_price: 199,
        company_kit_price: 299,
        js_kit_original_price: 1499,
        complete_kit_original_price: 2999,
        experiences_kit_original_price: 2999,
        react_kit_original_price: 1999,
        company_kit_original_price: 999,
        discount_percentage: 90,
        discount_ios_percentage: 50,
        js_kit_plan_name: "Javascript Interview Preparation Kit",
        complete_kit_plan_name: "Complete Frontend Interview Preparation Kit",
        experiences_kit_plan_name: "Frontend Interview Experiences Kit",
        company_kit_plan_name: "Company Wise DSA Kit",

        // Company Wise Kit Pricing Tiers
        company_kit_plans: {
            '3m': {
                id: '3m',
                name: '3 Months',
                duration: '3 months',
                durationDays: 90,
                price: 299,
                originalPrice: 599,
                perMonth: 100,
                popular: false,
            },
            '6m': {
                id: '6m',
                name: '6 Months',
                duration: '6 months',
                durationDays: 180,
                price: 599,
                originalPrice: 999,
                perMonth: 100,
                popular: true,
            },
            'lifetime': {
                id: 'lifetime',
                name: 'Lifetime',
                duration: 'Forever',
                durationDays: 36500, // 100 years
                price: 899,
                originalPrice: 1999,
                perMonth: null,
                popular: false,
                bestValue: true,
            },
        },
    }
}