// Quiz functionality

function selectRadio(element, questionId, value) {
    const options = document.querySelectorAll(`#${questionId} .option`);
    options.forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
}

function toggleCheckbox(element, questionId, value) {
    element.classList.toggle('selected');
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
}

function checkAnswer(questionId, correctAnswer) {
    const selected = document.querySelector(`input[name="${questionId}"]:checked`);
    const feedback = document.getElementById(`${questionId}-feedback`);
    const options = document.querySelectorAll(`#${questionId} .option`);
    
    if (!selected) {
        feedback.className = 'feedback incorrect';
        feedback.textContent = 'Please select an answer!';
        return;
    }

    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        const input = opt.querySelector('input');
        if (input.value === correctAnswer) {
            opt.classList.add('correct');
        } else if (input.checked) {
            opt.classList.add('incorrect');
        }
    });

    if (selected.value === correctAnswer) {
        feedback.className = 'feedback correct';
        feedback.textContent = '✓ Correct! Great job!';
    } else {
        feedback.className = 'feedback incorrect';
        feedback.textContent = '✗ Incorrect. Try again or check the hint!';
    }
}

function checkMultipleAnswer(questionId, correctAnswers) {
    const selected = Array.from(document.querySelectorAll(`input[name="${questionId}"]:checked`))
        .map(input => input.value);
    const feedback = document.getElementById(`${questionId}-feedback`);
    const options = document.querySelectorAll(`#${questionId} .option`);
    
    if (selected.length === 0) {
        feedback.className = 'feedback incorrect';
        feedback.textContent = 'Please select at least one answer!';
        return;
    }

    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        const input = opt.querySelector('input');
        if (correctAnswers.includes(input.value)) {
            opt.classList.add('correct');
        } else if (input.checked) {
            opt.classList.add('incorrect');
        }
    });

    const isCorrect = selected.length === correctAnswers.length &&
        selected.every(val => correctAnswers.includes(val));

    if (isCorrect) {
        feedback.className = 'feedback correct';
        feedback.textContent = '✓ Correct! You selected all the right answers!';
    } else {
        feedback.className = 'feedback incorrect';
        feedback.textContent = '✗ Not quite. Review which statements are true about SVD.';
    }
}

function checkNumericAnswer(questionId, correctAnswer, tolerance) {
    const input = document.getElementById(`${questionId}-input`);
    const feedback = document.getElementById(`${questionId}-feedback`);
    const userAnswer = parseFloat(input.value);

    if (isNaN(userAnswer)) {
        feedback.className = 'feedback incorrect';
        feedback.textContent = 'Please enter a valid number!';
        return;
    }

    if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
        feedback.className = 'feedback correct';
        feedback.textContent = `✓ Correct! The answer is ${correctAnswer}.`;
        input.style.borderColor = '#4caf50';
    } else {
        feedback.className = 'feedback incorrect';
        feedback.textContent = `✗ Incorrect. The correct answer is ${correctAnswer}.`;
        input.style.borderColor = '#f44336';
    }
}
