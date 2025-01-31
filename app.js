const express = require('express');
const { create } = require('express-handlebars');
const path = require('path');

const app = express();

// Set up Handlebars
const hbs = create({ extname: '.hbs' });
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Function to calculate investment growth and survival
function calculateInvestment({
    initialAmount,
    monthlyContribution,
    interestRate, // Annual interest rate
    inflationRate, // Annual inflation rate
    currentAge,
    retirementAge,
    monthlyWithdrawal,
    percentageIncreaseMonthlyContribution 
}) {
    const results = [];
    let currentAmount = initialAmount; // Initial savings
    let totalInvested = initialAmount; // Tracks total contributions
    let age = currentAge;
    
    if (typeof age !== "number" || age > 150 || age < 0 || isNaN(age)) {
        alert("Humans don't have that kind of age");
      }
    
      if (
        typeof retirementAge !== "number" ||
        retirementAge > 150 ||
        retirementAge < 0 ||
        isNaN(retirementAge)
      ) {
        alert("Humans don't retire in that kind of age");
      }
    // Phase 1: Pre-retirement (contributions + annual interest growth)
    while (age < retirementAge) {
        // Add annual contributions
        const yearlyContribution = monthlyContribution * 12;
        currentAmount += currentAmount * (interestRate / 100);
        currentAmount += yearlyContribution;
        totalInvested += yearlyContribution;
        // Adding annual interest rate
         currentAmount += monthlyContribution * 6 * (interestRate / 100); // average inerest rate of the year of all months average

         //Inflation adjusted
         currentAmount -= currentAmount * (inflationRate / 100);

        monthlyContribution +=
        monthlyContribution * (percentageIncreaseMonthlyContribution / 100);
  
        results.push({
            age: ++age,
            totalInvested: totalInvested.toFixed(2),
            totalSavings: currentAmount.toFixed(2),
            withdrawal: 0, // No withdrawals pre-retirement
        });
    }

    // Phase 2: Post-retirement (withdrawals + annual interest + inflation adjustment)
    while (currentAmount > 0) {
                // Deduct annual withdrawals
                const yearlyWithdrawal = monthlyWithdrawal * 12;
                currentAmount -= yearlyWithdrawal;
        // Apply annual interest rate
        currentAmount += currentAmount * (interestRate / 100);
        currentAmount += monthlyWithdrawal * 6  * (interestRate / 100);
        // Adjust for annual inflation
        currentAmount -= currentAmount * (inflationRate / 100);

        if (currentAmount <= 0) break; // Stop if savings are exhausted

        results.push({
            age: ++age,
            totalInvested: totalInvested.toFixed(2), // No new contributions post-retirement
            totalSavings: currentAmount > 0 ? currentAmount.toFixed(2) : 0,
            withdrawal: yearlyWithdrawal.toFixed(2),
        });
    }

    return results;
}

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Investment Calculator' });
});

app.post('/', (req, res) => {
    const {
        initialAmount,
        monthlyContribution,
        interestRate,
        inflationRate,
        currentAge,
        retirementAge,
        monthlyWithdrawal,
        percentageIncreaseMonthlyContribution
    } = req.body;

    const results = calculateInvestment({
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution),
        interestRate: parseFloat(interestRate),
        inflationRate: parseFloat(inflationRate),
        currentAge: parseInt(currentAge, 10),
        retirementAge: parseInt(retirementAge, 10),
        monthlyWithdrawal: parseFloat(monthlyWithdrawal),
        percentageIncreaseMonthlyContribution: parseFloat(percentageIncreaseMonthlyContribution)
    });

    const labels = results.map((r) => r.age);
    const totalSavings = results.map((r) => r.totalSavings);
    const withdrawals = results.map((r) => r.withdrawal);

    res.render('index', {
        title: 'Investment Calculator',
        results,
        labels: JSON.stringify(labels),
        totalSavings: JSON.stringify(totalSavings),
        withdrawals: JSON.stringify(withdrawals),
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
