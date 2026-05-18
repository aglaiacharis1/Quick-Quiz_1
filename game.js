const question = document.getElementById("question");
const choices = Array.from(document.getElementsByClassName("choice-text"));
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("score");
const progressBarFull = document.getElementById("progressBarFull");
const loader = document.getElementById("loader");
const game = document.getElementById("game");

let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];

let questions = [];

// CONSTANTS
const CORRECT_BONUS = 10;
const MAX_QUESTIONS = 3;

// Helper function to decode HTML entities like &ldquo;, &rsquo;, &amp;, etc.
function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Fetch questions from the Open Trivia Database API
fetch("https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple")
    .then(res => {
        return res.json();
    })
    .then(loadedQuestions => {
        // Map through the raw API questions and clean them up
        const formattedQuestions = loadedQuestions.results.map(loadedQuestion => {
            const formattedQuestion = {
                // Decode the main question text immediately
                question: decodeHTML(loadedQuestion.question) 
            };

            // Copy the incorrect answers array
            const answerChoices = [...loadedQuestion.incorrect_answers];
            
            // Pick a random index (1 to 4) to insert the correct answer
            formattedQuestion.answer = Math.floor(Math.random() * 4) + 1;
            answerChoices.splice(formattedQuestion.answer - 1, 0, loadedQuestion.correct_answer);

            // Assign choices to the formattedQuestion object and decode them
            answerChoices.forEach((choice, index) => {
                formattedQuestion["choice" + (index + 1)] = decodeHTML(choice);
            });

            return formattedQuestion;
        });

        // Save our cleaned questions to the global array and start the game
        questions = formattedQuestions; 
        startGame();                    
    })
    .catch(err => {
        console.error("Failed to load questions from API:", err);
    });

startGame = () => {
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    getNewQuestion();

    // Hide loader and reveal the game screen
    game.classList.remove("hidden");
    loader.classList.add("hidden");
};

getNewQuestion = () => {
    // Check if we run out of questions or hit our max question cap
    if (availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
        localStorage.setItem("mostRecentScore", score);
        // Go to the end page
        return window.location.assign("/end.html");
    }

    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
    
    // Update the progress bar fill width
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    // Pick a random question from our available question pool
    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;

    // Populate choices into the DOM elements
    choices.forEach(choice => {
        const number = choice.dataset["number"];
        choice.innerText = currentQuestion["choice" + number];
    });

    // Remove the used question from the pool so it doesn't repeat
    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
};

// Set up event listeners for the choices
choices.forEach(choice => {
    choice.addEventListener("click", e => {
        if (!acceptingAnswers) return;

        acceptingAnswers = false;
        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset["number"];

        // Check if selected choice number matches the correct answer index
        const classToApply = selectedAnswer == currentQuestion.answer ? "correct" : "incorrect";
           
        if (classToApply === "correct") {
            incrementScore(CORRECT_BONUS);
        }

        // Apply visual feedback class to the parent container element
        selectedChoice.parentElement.classList.add(classToApply);
        
        // Wait 1 second before loading the next question
        setTimeout(() => {
            selectedChoice.parentElement.classList.remove(classToApply);
            getNewQuestion();
        }, 1000);
    });
});

incrementScore = num => {
    score += num;
    scoreText.innerText = score;
};