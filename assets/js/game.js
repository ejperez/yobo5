var Game = {};

(function ($) {
	var currentLevelVars = {
		questionText: $('.question-text'),
		prizeText: $('.prize-text'),
		questionChoices: $('.question-choices'),
		currentAnswer: null,
		currentQuestion: null
	};

	var maxLevel = 2;

	Game.init = function () {
		Game.currentLevel = 1;
		Game.state = 'welcome';
		Game.data = {};
		Game.containers = {
			welcome: $('.container-welcome'),
			playing: $('.container-playing'),
			correct: $('.container-correct'),
			wrong: $('.container-wrong'),
			won: $('.container-won')
		};

		// Get levels data
		$.get({
			url: 'data/levels.json',
			dataType: 'json',
			success: function (data) {
				Game.data = data;
			}
		});

		// Event handlers
		$(document).on('click', '.btn-play', function () {
			Game.state = 'playing';
			Game.currentLevel = 1;
			Game.containers.welcome.addClass('hide');
			Game.containers.wrong.addClass('hide');
			Game.update();
		});

		$(document).on('click', '.btn-choice', function () {
			Game.state = 'checking';
			currentLevelVars.currentAnswer = $(this).data('value');
			Game.update();
		});

		// Start when all AJAX calls are finished
		$(document).ajaxStop(function () {
			Game.update();
		});
	};

	Game.update = function () {
		console.log(Game.state);

		switch (Game.state) {
			case 'welcome':
				Game.containers.welcome.removeClass('hide');

				break;
			case 'playing':
				Game.containers.playing.removeClass('hide');
				initializeCurrentLevelScreen();

				break;
			case 'checking':
				if (currentLevelVars.currentAnswer === currentLevelVars.currentQuestion.answer) {
					Game.state = 'correct';
				} else {
					Game.state = 'wrong';
				}

				Game.containers.playing.addClass('hide');
				Game.update();

				break;
			case 'correct':
				Game.containers.correct.removeClass('hide');

				setTimeout(function () {
					Game.containers.correct.addClass('hide');
					Game.state = 'continue';
					Game.currentLevel += 1;
					Game.update();
				}, 1000)
				break;
			case 'wrong':
				Game.containers.wrong.removeClass('hide');
				break;
			case 'continue':
				Game.containers.playing.removeClass('hide');

				if (Game.currentLevel <= maxLevel) {
					initializeCurrentLevelScreen();
				} else {
					Game.state = 'won';
					Game.containers.playing.addClass('hide');
					Game.update();
				}

				break;
			case 'won':
				Game.containers.won.removeClass('hide');
				break;
		}
	};

	// Private functions
	var getCurrentLevel = function () {
		return Game.data.levels[Game.currentLevel - 1];
	};

	var initializeCurrentLevelScreen = function () {
		var level = getCurrentLevel();

		// Show the prize
		currentLevelVars.prizeText.html(level.prize);

		// Select a question
		var selectedQuestionIndex = generateRandomInt(0, level.questions.length);

		// Get the question
		currentLevelVars.currentQuestion = level.questions[selectedQuestionIndex];

		// Show the question
		currentLevelVars.questionText.html(currentLevelVars.currentQuestion.question);

		// Combine the options and the answer
		var choices = [];
		choices.push(currentLevelVars.currentQuestion.answer);
		Array.prototype.push.apply(choices, currentLevelVars.currentQuestion.options);

		// Shuffle the choices
		choices = shuffleArray(choices);

		// Show the choices
		currentLevelVars.questionChoices.html(generateChoices(choices));
	};

	var generateChoices = function (choices) {
		var html = '';
		var alphabet = ['A.', 'B.', 'C.', 'D.'];

		choices.forEach(function (choice, index) {
			html += '<button style="white-space:normal" class="btn btn-default btn-block btn-choice" data-value="' + choice + '">' + alphabet[index] + '' + choice + '</button>';
		});

		return html;
	};

	$(function () {
		Game.init();
	});
})(jQuery);