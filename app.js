const express = require('express');
const { create } = require('express-handlebars');
const path = require('path');
const country_data = require('./store/country25.json');

const app = express();

// Set up Handlebars
const hbs = create({ extname: '.hbs' });
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function calculateInvestment(params) {
    const results = [];
    const MAX_AGE = 123; // Maximum age for calculations

    const {
        currency,
        initialAmount,
        monthlyContribution: initialMonthlyContribution,
        interestRate,
        inflationRate,
        currentAge,
        retirementAge,
        monthlyWithdrawal,
        percentageIncreaseMonthlyContribution
    } = params;

    // Validate inputs
    if (
        typeof currentAge !== "number" ||
        typeof retirementAge !== "number" ||
        currentAge <= 0 || retirementAge <= 0 ||
        currentAge > MAX_AGE || retirementAge > MAX_AGE ||
        isNaN(currentAge) || isNaN(retirementAge)
    ) {
        throw new Error(`Invalid age provided. Age should be between 1 and ${MAX_AGE}.`);
    }

    if (retirementAge <= currentAge) {
        throw new Error("Retirement age must be greater than current age.");
    }

    let currentAmount = initialAmount;
    let totalInvested = initialAmount;
    let age = currentAge;
    let monthlyContribution = initialMonthlyContribution;

    // Phase 1: Pre-retirement (Accumulation)
    while (age < retirementAge && age < MAX_AGE) {
        const yearlyContribution = monthlyContribution * 12;
        
        // Apply annual growth
        currentAmount *= (1 + interestRate / 100);
        currentAmount += yearlyContribution;
        
        // Approximate mid-year growth on contributions
        currentAmount += monthlyContribution * 6 * (interestRate / 100);
        
        // Adjust for inflation
        currentAmount *= (1 - inflationRate / 100);
        
        totalInvested += yearlyContribution;
        monthlyContribution *= (1 + percentageIncreaseMonthlyContribution / 100);

        results.push({
            age: ++age,
            totalInvested: totalInvested.toFixed(2),
            totalSavings: currentAmount.toFixed(2),
            withdrawal: "0.00",
            currency: currency
        });

        if (!isFinite(currentAmount)) {
            throw new Error("Calculation error: result is too large or invalid.");
        }
    }

    // Phase 2: Post-retirement (Withdrawal)
    while (currentAmount > 0 && age < MAX_AGE) {
        const yearlyWithdrawal = monthlyWithdrawal * 12;
        const actualWithdrawal = Math.min(yearlyWithdrawal, currentAmount);
        
        // Withdraw first
        currentAmount -= actualWithdrawal;
        
        // Apply growth to remaining balance
        if (currentAmount > 0) {
            currentAmount *= (1 + interestRate / 100);
            currentAmount += (actualWithdrawal / 12) * 6 * (interestRate / 100);
            currentAmount *= (1 - inflationRate / 100);
        }

        results.push({
            age: ++age,
            totalInvested: totalInvested.toFixed(2),
            totalSavings: Math.max(currentAmount, 0).toFixed(2),
            withdrawal: actualWithdrawal.toFixed(2),
            currency: currency
        });

        if (!isFinite(currentAmount)) {
            throw new Error("Calculation error: result is too large or invalid.");
        }

        // Stop if money runs out completely
        if (currentAmount <= 0) break;

        if (age >= MAX_AGE) {
  results.push({
    age: MAX_AGE,
    totalInvested: "",
    totalSavings: "",
    withdrawal: "",
    currency: "",
    note: `⚠️ Calculation stopped at age ${MAX_AGE}.
This limit is based on global life expectancy trends and financial planning best practices.
For this calculator, we consider 123 as the upper bound, inspired by the oldest verified human lifespan (Jeanne Calment, 122 years).`
  });
}
    }

    return results;
}

// function calculateInvestment(params) {
//     const results = [];
//     const MAX_AGE = 123; // Maximum age for calculations

//     const {
//         currency,
//         initialAmount,
//         monthlyContribution: initialMonthlyContribution,
//         interestRate,
//         inflationRate,
//         currentAge,
//         retirementAge,
//         monthlyWithdrawal,
//         percentageIncreaseMonthlyContribution
//     } = params;

//     // Validate inputs
//     if (
//         typeof currentAge !== "number" ||
//         typeof retirementAge !== "number" ||
//         currentAge <= 0 || retirementAge <= 0 ||
//         currentAge > MAX_AGE || retirementAge > MAX_AGE ||
//         isNaN(currentAge) || isNaN(retirementAge)
//     ) {
//         throw new Error(`Invalid age provided. Age should be between 1 and ${MAX_AGE}.`);
//     }

//     if (retirementAge <= currentAge) {
//         throw new Error("Retirement age must be greater than current age.");
//     }

//     let currentAmount = initialAmount;
//     let totalInvested = initialAmount;
//     let age = currentAge;
//     let monthlyContribution = initialMonthlyContribution;

//     // Phase 1: Pre-retirement (Accumulation)
//     while (age < retirementAge && age < MAX_AGE) {
//         const yearlyContribution = monthlyContribution * 12;
        
//         // Apply annual growth
//         currentAmount *= (1 + interestRate / 100);
//         currentAmount += yearlyContribution;
        
//         // Approximate mid-year growth on contributions
//         currentAmount += monthlyContribution * 6 * (interestRate / 100);
        
//         // Adjust for inflation
//         currentAmount *= (1 - inflationRate / 100);
        
//         totalInvested += yearlyContribution;
//         monthlyContribution *= (1 + percentageIncreaseMonthlyContribution / 100);

//         results.push({
//             age: ++age,
//             totalInvested: totalInvested.toFixed(2),
//             totalSavings: currentAmount.toFixed(2),
//             withdrawal: "0.00", // Consistent format for accumulation phase
//             currency: currency
//         });

//         if (!isFinite(currentAmount)) {
//             throw new Error("Calculation error: result is too large or invalid.");
//         }
//     }

//     // Phase 2: Post-retirement (Withdrawal)
//     while (currentAmount > 0 && age < MAX_AGE) {
//         const yearlyWithdrawal = monthlyWithdrawal * 12;
        
//         // Withdraw first
//         currentAmount = Math.max(currentAmount - yearlyWithdrawal, 0);
        
//         // Apply growth
//         currentAmount *= (1 + interestRate / 100);
        
//         // Approximate mid-year growth on withdrawals
//         currentAmount += monthlyWithdrawal * 6 * (interestRate / 100);
        
//         // Adjust for inflation
//         currentAmount *= (1 - inflationRate / 100);

//         results.push({
//             age: ++age,
//             totalInvested: totalInvested.toFixed(2),
//             totalSavings: currentAmount.toFixed(2),
//             withdrawal: yearlyWithdrawal.toFixed(2),
//             currency: currency
//         });

//         if (!isFinite(currentAmount)) {
//             throw new Error("Calculation error: result is too large or invalid.");
//         }
//     }

//     // Final record if we reached max age with remaining funds
//     if (age === MAX_AGE && currentAmount > 0) {
//         results.push({
//             age: MAX_AGE,
//             totalInvested: totalInvested.toFixed(2),
//             totalSavings: currentAmount.toFixed(2),
//             withdrawal: "0.00", // No withdrawal in final year
//             currency: currency
//         });
//     }

//     return results;
// }
// function calculateInvestment(params) {
//     const results = [];

//     const {
//       currency,
//       initialAmount,
//       monthlyContribution: initialMonthlyContribution,
//       interestRate,
//       inflationRate,
//       currentAge,
//       retirementAge,
//       monthlyWithdrawal,
//       percentageIncreaseMonthlyContribution
//     } = params;

//     if (
//       typeof currentAge !== "number" ||
//       typeof retirementAge !== "number" ||
//       currentAge <= 0 || retirementAge <= 0 ||
//       currentAge > 110 || retirementAge > 110 ||
//       isNaN(currentAge) || isNaN(retirementAge)
//     ) {
//       throw new Error("Invalid age provided. Age should be between 1 and 110.");
//     }

//     if (retirementAge <= currentAge) {
//       throw new Error("Retirement age must be greater than current age.");
//     }

//     let currentAmount = initialAmount;
//     let totalInvested = initialAmount;
//     let age = currentAge;
//     let monthlyContribution = initialMonthlyContribution;

//     // Phase 1: Pre-retirement
//     while (age < retirementAge) {
//       const yearlyContribution = monthlyContribution * 12;
//       currentAmount += currentAmount * (interestRate / 100);
//       currentAmount += yearlyContribution;
//       totalInvested += yearlyContribution;
//       currentAmount += monthlyContribution * 6 * (interestRate / 100);
//       currentAmount -= currentAmount * (inflationRate / 100);
//       monthlyContribution += monthlyContribution * (percentageIncreaseMonthlyContribution / 100);

//       results.push({
//         age: ++age,
//         totalInvested: totalInvested.toFixed(2),
//         totalSavings: currentAmount.toFixed(2),
//         withdrawal: 0,
//         currency:currency
//       });

//       if (!isFinite(currentAmount)) {
//         throw new Error("Calculation error: result is too large or invalid.");
//       }
//     }

//     // Phase 2: Post-retirement
//     while (currentAmount > 0 && age <= 110) {
//       const yearlyWithdrawal = monthlyWithdrawal * 12;
//       currentAmount -= yearlyWithdrawal;
//       currentAmount += currentAmount * (interestRate / 100);
//       currentAmount += monthlyWithdrawal * 6 * (interestRate / 100);
//       currentAmount -= currentAmount * (inflationRate / 100);
//       currentAmount = Math.max(currentAmount, 0);

//       results.push({
//         age: ++age,
//         totalInvested: totalInvested.toFixed(2),
//         totalSavings: currentAmount.toFixed(2),
//         withdrawal: yearlyWithdrawal.toFixed(2),
//         currency:currency
//       });

//       if (!isFinite(currentAmount)) {
//         throw new Error("Calculation error: result is too large or invalid.");
//       }

//       if (results.length > 100) break; // safety cap for mobile
//     }
//     return results;
// }

// Routes
app.get('/', (req, res) => {

    res.render('index', { title: 'Investment Calculator' ,
      country : country_data
    });
});

app.post('/', (req, res) => {
    const {
      currency,
        initialAmount,
        monthlyContribution,
        interestRate,
        inflationRate,
        currentAge,
        retirementAge,
        monthlyWithdrawal,
        percentageIncreaseMonthlyContribution
    } = req.body;

try {
   const results = calculateInvestment({
        currency:currency,
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution),
        interestRate: parseFloat(interestRate),
        inflationRate: parseFloat(inflationRate),
        currentAge: parseInt(currentAge, 10),
        retirementAge: parseInt(retirementAge, 10),
        monthlyWithdrawal: parseFloat(monthlyWithdrawal),
        percentageIncreaseMonthlyContribution: parseFloat(percentageIncreaseMonthlyContribution)
    });

    const labels = results?.map((r) => r.age);
    const totalSavings = results?.map((r) => r.totalSavings);
    const withdrawals = results?.map((r) => r.withdrawal);


    res.render('index', {
        title: 'Investment Calculator',
        results,
        labels: JSON.stringify(labels),
        totalSavings: JSON.stringify(totalSavings),
        withdrawals: JSON.stringify(withdrawals),
        country : country_data,
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution),
        interestRate: parseFloat(interestRate),
        inflationRate: parseFloat(inflationRate),
        currentAge: parseInt(currentAge, 10),
        retirementAge: parseInt(retirementAge, 10),
        monthlyWithdrawal: parseFloat(monthlyWithdrawal),
        percentageIncreaseMonthlyContribution: parseFloat(percentageIncreaseMonthlyContribution)
    });
}catch(error){
    res.render('index', { title: 'Investment Calculator' ,
      country : country_data,
      errorMessage: `❌ Error: ${error.message}`,
      results:[],
        country : country_data,
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution),
        interestRate: parseFloat(interestRate),
        inflationRate: parseFloat(inflationRate),
        currentAge: parseInt(currentAge, 10),
        retirementAge: parseInt(retirementAge, 10),
        monthlyWithdrawal: parseFloat(monthlyWithdrawal),
        percentageIncreaseMonthlyContribution: parseFloat(percentageIncreaseMonthlyContribution)
    });
}

});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
