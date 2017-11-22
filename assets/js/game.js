var Game = {};

( function ( $ ) {
	var currentLevelVars = {
		questionText: $( '.question-text' ),
		prizeText: $( '.prize-text' ),
		levelText: $( '.level-text' ),
		questionChoices: $( '.question-choices' ),
		currentAnswer: null,
		currentQuestion: null
	};

	var maxLevel = 10;
	var imgWrong = $( '.img-wrong' );
	var imgCorrect = $( '.img-correct' );
	var btnLifelines = $( '.btn-lifeline' );
	var btnResume = $( '.btn-resume' );
	var ringing = $( '.ringing' );
	var imagePath = 'assets/images/';

	var friend = {
		name: $( '.friend-name' ),
		image: $( '.friend-image' ),
		message: $( '.friend-message' )
	};

	Game.init = function () {
		Game.currentLevel = 1;
		Game.state = 'welcome';
		Game.data = {};
		Game.containers = {
			welcome: $( '.container-welcome' ),
			playing: $( '.container-playing' ),
			correct: $( '.container-correct' ),
			wrong: $( '.container-wrong' ),
			won: $( '.container-won' ),
			friend: $( '.container-friend' ),
			claim: $( '.container-claim' ),
		};

		// Get levels data
		$.get( {
			url: 'data/levels.json',
			dataType: 'json',
			success: function ( data ) {
				Game.data.levels = data.levels;
			}
		} );

		// Get images data
		$.get( {
			url: 'data/images.json',
			dataType: 'json',
			success: function ( data ) {
				Game.data.images = data.images;
			}
		} );

		// Get friends data
		$.get( {
			url: 'data/friends.json',
			dataType: 'json',
			success: function ( data ) {
				Game.data.friends = data.friends;
			}
		} );

		// Get claim data
		$.get( {
			url: 'data/claim.json',
			dataType: 'json',
			success: function ( data ) {
				Game.data.claim = data.claim;
			}
		} );

		// Event handlers
		// Play button click
		$( document ).on( 'click', '.btn-play', function () {
			Game.state = 'playing';
			Game.currentLevel = 1;

			// Hide other containers
			Game.containers.welcome.addClass( 'hide' );
			Game.containers.wrong.addClass( 'hide' );
			Game.containers.claim.addClass( 'hide' );

			// Reset background
			$( 'body' ).css( 'background-image', 'url(assets/images/bg.jpg)' );

			// Reset lifelines
			btnLifelines.prop( 'disabled', false );

			Game.update();
		} );

		// Choice click
		$( document ).on( 'click', '.btn-choice', function () {
			Game.state = 'checking';
			currentLevelVars.currentAnswer = $( this ).data( 'value' );
			Game.update();
		} );

		// Lifeline 50:50 button click
		$( document ).on( 'click', '.btn-5050', function () {
			// Select two distinct choices to be removed
			var choice1Index = currentLevelVars.currentQuestion.options[generateRandomInt( 0, currentLevelVars.currentQuestion.options.length )];
			var choice2Index = currentLevelVars.currentQuestion.options[generateRandomInt( 0, currentLevelVars.currentQuestion.options.length )];

			while ( choice2Index === choice1Index ) {
				choice2Index = currentLevelVars.currentQuestion.options[generateRandomInt( 0, currentLevelVars.currentQuestion.options.length )];
			}

			// Disabled them
			currentLevelVars.questionChoices.find( '.btn-choice[data-value="' + choice1Index + '"]' ).prop( 'disabled', true );
			currentLevelVars.questionChoices.find( '.btn-choice[data-value="' + choice2Index + '"]' ).prop( 'disabled', true );

			// Disable lifeline
			$( this ).prop( 'disabled', true );
		} );

		// Lifeline ask the audience button click
		$( document ).on( 'click', '.btn-ask', function () {
			// Generate random vote counts
			var remainingVotes = 100;

			var choices = currentLevelVars.questionChoices.find( '.btn-choice' );
			$.each( choices, function ( index, value ) {
				if ( index === choices.length - 1 ) {
					var randomVoteCount = remainingVotes;
				} else {
					var randomVoteCount = generateRandomInt( 1, remainingVotes );
					remainingVotes -= randomVoteCount;
				}

				var html = $( value ).html() + ' <span class="badge">' + randomVoteCount + ' vote(s)</span>';

				$( value ).html( html );
			} );

			// Disable lifeline
			$( this ).prop( 'disabled', true );
		} );

		// Lifeline call a friend button click
		var callAFriendInterval, timeLimit;
		$( document ).on( 'click', '.btn-call', function () {
			// Reset time limit
			timeLimit = 10;

			// Select random friend
			var selectedFriend = Game.data.friends[generateRandomInt( 0, Game.data.friends.length )];

			// Generate random choice
			var choices = ['A', 'B', 'C', 'D'];
			var randomChoiceIndex = generateRandomInt( 0, choices.length );

			// Show friend
			friend.name.html( selectedFriend.name );
			friend.image.prop( 'src', imagePath + selectedFriend.image );

			// Replace choice placeholder
			var message = selectedFriend.message.replace( '{choice}', choices[randomChoiceIndex] );
			friend.message.html( message );

			Game.containers.playing.addClass( 'hide' );
			Game.containers.friend.removeClass( 'hide' );

			// Disable lifeline
			$( this ).prop( 'disabled', true );

			ringing.show();

			ringing.fadeOut( 3000, function () {
				// Show fields
				ringing.addClass( 'hide' );
				btnResume.removeClass( 'hide' );
				friend.name.removeClass( 'hide' );
				friend.image.removeClass( 'hide' );
				friend.message.removeClass( 'hide' );

				// Start timer
				callAFriendInterval = setInterval( function () {
					if ( timeLimit < 0 ) {
						resume();
					} else {
						btnResume.html( 'Back to question (' + timeLimit + ')' );
						timeLimit--;
					}
				}, 1000 );
			} );
		} );

		// Claim button click
		$( document ).on( 'click', '.btn-claim', function () {
			Game.state = 'claim';
			Game.containers.won.addClass( 'hide' );
			Game.update();
		} );

		// Resume after call a friend
		var resume = function () {
			clearInterval( callAFriendInterval );
			Game.status = 'resume';
			Game.containers.friend.addClass( 'hide' );
			Game.update();
		};

		$( document ).on( 'click', '.btn-resume', resume );

		// Start when all AJAX calls are finished
		$( document ).ajaxStop( function () {
			Game.update();
		} );
	};

	Game.update = function () {

		console.log( Game.state );

		switch ( Game.state ) {
			case 'welcome':
				Game.containers.welcome.removeClass( 'hide' );

				break;
			case 'playing':
				Game.containers.playing.removeClass( 'hide' );
				initializeCurrentLevelScreen();

				break;
			case 'checking':
				if ( currentLevelVars.currentAnswer === currentLevelVars.currentQuestion.answer || parseInt( currentLevelVars.currentAnswer ) === parseInt( currentLevelVars.currentQuestion.answer ) ) {
					Game.state = 'correct';
				} else {
					Game.state = 'wrong';
				}

				Game.containers.playing.addClass( 'hide' );
				Game.update();

				break;
			case 'correct':
				var image = imagePath + Game.data.images.win[generateRandomInt( 0, Game.data.images.win.length )];
				imgCorrect.prop( 'src', image );
				Game.containers.correct.removeClass( 'hide' );

				setTimeout( function () {
					Game.containers.correct.addClass( 'hide' );
					Game.state = 'continue';
					Game.currentLevel += 1;
					Game.update();
				}, 2000 )
				break;
			case 'wrong':
				var image = imagePath + Game.data.images.lose[generateRandomInt( 0, Game.data.images.lose.length )];
				imgWrong.prop( 'src', image );
				Game.containers.wrong.removeClass( 'hide' );
				break;
			case 'continue':
				Game.containers.playing.removeClass( 'hide' );

				if ( Game.currentLevel <= maxLevel ) {
					initializeCurrentLevelScreen();
				} else {
					Game.state = 'won';
					Game.containers.playing.addClass( 'hide' );
					Game.update();
				}

				break;
			case 'won':
				Game.containers.won.removeClass( 'hide' );
				break;
			case 'resume':
				Game.containers.playing.removeClass( 'hide' );
				break;
			case 'claim':
				Game.containers.claim.removeClass( 'hide' );
				$( 'body' ).css( 'background-image', 'url(assets/images/win-bg.jpg)' );

				// Output data
				var html = '';
				Game.data.claim.forEach( function ( item ) {
					switch ( item.type ) {
						case 'image':
							html += '<img class="img-responsive" src="' + imagePath + item.content + '">';
							break;
						case 'title':
							html += '<h1>' + item.content + '</h1>';
							break;
						case 'text':
							html += '<p>' + item.content + '</p>';
							break;
					}
				} );
				Game.containers.claim.find( '.content' ).html( html );
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
		currentLevelVars.prizeText.html( level.prize );

		// Show the current level
		currentLevelVars.levelText.html( 'Level ' + Game.currentLevel + ' of ' + maxLevel );

		// Select a question
		var selectedQuestionIndex = generateRandomInt( 0, level.questions.length );

		// Get the question
		currentLevelVars.currentQuestion = level.questions[selectedQuestionIndex];

		// Show the question
		currentLevelVars.questionText.html( currentLevelVars.currentQuestion.question );

		// Combine the options and the answer
		var choices = [];
		choices.push( currentLevelVars.currentQuestion.answer );
		Array.prototype.push.apply( choices, currentLevelVars.currentQuestion.options );

		// Shuffle the choices
		choices = shuffleArray( choices );

		// Show the choices
		currentLevelVars.questionChoices.html( generateChoices( choices ) );
	};

	var generateChoices = function ( choices ) {
		var html = '';
		var alphabet = ['A.', 'B.', 'C.', 'D.'];

		choices.forEach( function ( choice, index ) {
			html += '<button style="white-space:normal;text-align:left;" class="btn btn-default btn-block btn-choice" data-value="' + choice + '">' + alphabet[index] + ' ' + choice + '</button>';
		} );

		return html;
	};

	$( function () {
		Game.init();
	} );
} )( jQuery );