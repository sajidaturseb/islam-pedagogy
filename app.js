(() => {
  'use strict';

  const lessons = Array.isArray(window.COURSE_DATA) ? window.COURSE_DATA : [];
  const byNumber = new Map(lessons.map(lesson => [lesson.n, lesson]));
  const params = new URLSearchParams(location.search);
  const requested = Number(params.get('lesson'));
  let current = byNumber.get(requested) || lessons[0];
  let reviewIndex = 0;
  let quizIndex = 0;
  let quizAnswers = [];
  let openText = '';
  let checked = false;
  const $ = id => document.getElementById(id);
  const screens = ['home', 'intro', 'review', 'identity', 'quiz', 'result'];
  const stageNames = {
    intro: 'Дәрес белән танышу', review: 'Сораулар аша кабатлау',
    identity: 'Укучы турында мәгълүмат', quiz: 'Белемне тикшерү', result: 'Дәрес тәмам'
  };

  function show(screen) {
    screens.forEach(name => $(name).classList.toggle('hidden', name !== screen));
    $('progress').classList.toggle('hidden', screen === 'home');
    if (screen !== 'home') {
      const step = screens.indexOf(screen);
      $('stageName').textContent = stageNames[screen];
      $('stageCount').textContent = `${step} / 5`;
      $('stageFill').style.width = `${step * 20}%`;
    }
    window.scrollTo(0, 0);
  }

  function setupHome() {
    const cards = $('lessonCards');
    lessons.forEach(lesson => {
      const link = document.createElement('a');
      link.className = 'card';
      link.href = `?lesson=${lesson.n}`;
      const number = document.createElement('span');
      number.className = 'number';
      number.textContent = lesson.n;
      const title = document.createElement('strong');
      title.textContent = lesson.title;
      link.append(number, title);
      cards.append(link);
      const option = document.createElement('option');
      option.value = lesson.n;
      option.textContent = `${lesson.n}. ${lesson.title}`;
      $('teacherLesson').append(option);
    });
    if (current) $('teacherLesson').value = current.n;
  }

  function setupLesson() {
    if (!current) return;
    document.title = `${current.n} нче дәрес — Ислам педагогикасы`;
    $('coursePill').textContent = `${current.n} нче дәрес`;
    $('introTitle').textContent = current.title;
  }

  function lessonUrl() {
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('lesson', $('teacherLesson').value);
    const group = $('teacherGroup').value.trim();
    if (group) url.searchParams.set('group', group);
    return url.toString();
  }

  async function copyText(text, fallbackInput) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (fallbackInput) {
        fallbackInput.value = text;
        fallbackInput.classList.remove('hidden');
        fallbackInput.focus();
        fallbackInput.select();
      }
      return false;
    }
  }

  function renderReview() {
    const item = current.study[reviewIndex];
    $('reviewCounter').textContent = `${reviewIndex + 1} / ${current.study.length}`;
    $('reviewQuestion').textContent = `${reviewIndex + 1}. ${item.q}`;
    $('reviewAnswerText').textContent = item.a;
    $('reviewAnswer').classList.add('hidden');
    $('showAnswerBtn').classList.remove('hidden');
    $('nextReviewBtn').classList.add('hidden');
    $('nextReviewBtn').textContent = reviewIndex === current.study.length - 1 ? 'Тестка әзерләнергә' : 'Киләсе сорау';
  }

  function renderQuiz() {
    const isOpen = quizIndex === current.questions.length;
    checked = false;
    $('quizError').classList.add('hidden');
    $('quizFeedback').classList.add('hidden');
    $('quizOptions').replaceChildren();
    $('quizOptions').classList.toggle('hidden', isOpen);
    $('openWrap').classList.toggle('hidden', !isOpen);
    $('quizEyebrow').textContent = isOpen ? 'Гамәл · ачык бирем' : `${quizIndex < 3 ? 'Белем' : 'Педагогик хәл'} · ${quizIndex + 1} / 5`;
    $('nextQuizBtn').textContent = isOpen ? 'Дәресне тәмамларга' : 'Тикшерергә';
    if (isOpen) {
      $('quizQuestion').textContent = current.open;
      $('openAnswer').value = openText;
      return;
    }
    const item = current.questions[quizIndex];
    $('quizQuestion').textContent = item.q;
    item.o.forEach((answer, index) => {
      const label = document.createElement('label');
      label.className = 'option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'choice';
      input.value = String(index);
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = ['А', 'Ә', 'Б'][index];
      const text = document.createElement('span');
      text.textContent = answer;
      label.append(input, letter, text);
      $('quizOptions').append(label);
    });
  }

  function finish() {
    const right = current.questions.map((question, index) => Number(quizAnswers[index] === question.a));
    $('scoreText').textContent = `${right.reduce((a, b) => a + b, 0)} / 5`;
    $('theoryText').textContent = `${right.slice(0, 3).reduce((a, b) => a + b, 0)} / 3`;
    $('situationText').textContent = `${right.slice(3).reduce((a, b) => a + b, 0)} / 2`;
    $('resultText').textContent = `${$('studentName').value.trim()} · ${$('studentGroup').value.trim()}. Җавапларны карап, дәресне кабат үтәргә мөмкин.`;
    $('openPreview').textContent = openText;
    show('result');
  }

  if (!current || lessons.length !== 25) {
    document.querySelector('main').textContent = 'Дәрес мәгълүматларын йөкләп булмады.';
    return;
  }
  setupHome();
  setupLesson();
  $('studentGroup').value = params.get('group') || '';

  $('copyLinkBtn').addEventListener('click', async () => {
    const copied = await copyText(lessonUrl(), $('teacherLink'));
    $('copyNote').textContent = copied ? 'Сылтама күчереп алынды.' : 'Сылтаманы астагы юлдан күчереп алыгыз.';
  });
  for (const id of ['teacherLesson', 'teacherGroup']) {
    $(id).addEventListener(id === 'teacherLesson' ? 'change' : 'input', () => {
      $('teacherLink').classList.add('hidden');
      $('copyNote').textContent = '';
    });
  }
  $('startReviewBtn').addEventListener('click', () => { reviewIndex = 0; renderReview(); show('review'); });
  $('showAnswerBtn').addEventListener('click', () => {
    $('reviewAnswer').classList.remove('hidden');
    $('showAnswerBtn').classList.add('hidden');
    $('nextReviewBtn').classList.remove('hidden');
  });
  $('nextReviewBtn').addEventListener('click', () => {
    if (++reviewIndex < current.study.length) { renderReview(); window.scrollTo(0, 0); }
    else show('identity');
  });
  $('startTestBtn').addEventListener('click', () => {
    if (!$('studentName').value.trim() || !$('studentGroup').value.trim()) {
      $('identityError').textContent = 'Исем-фамилия һәм төркем юлларын тутырыгыз.';
      $('identityError').classList.remove('hidden');
      return;
    }
    $('identityError').classList.add('hidden');
    quizIndex = 0;
    quizAnswers = Array(current.questions.length).fill(null);
    openText = '';
    renderQuiz();
    show('quiz');
  });
  $('nextQuizBtn').addEventListener('click', () => {
    if (quizIndex < current.questions.length) {
      if (checked) { quizIndex++; renderQuiz(); window.scrollTo(0, 0); return; }
      const chosen = document.querySelector('input[name="choice"]:checked');
      if (!chosen) {
        $('quizError').textContent = 'Бер җавапны сайлагыз.';
        $('quizError').classList.remove('hidden');
        return;
      }
      const selected = Number(chosen.value);
      const item = current.questions[quizIndex];
      const correct = selected === item.a;
      quizAnswers[quizIndex] = selected;
      checked = true;
      document.querySelectorAll('.option').forEach((option, index) => {
        option.classList.add('locked');
        option.querySelector('input').disabled = true;
        if (index === item.a) option.classList.add('correct');
        if (index === selected && !correct) option.classList.add('wrong');
      });
      $('quizFeedback').className = `feedback ${correct ? 'right' : 'wrong'}`;
      $('feedbackTitle').textContent = correct ? 'Дөрес җавап!' : 'Бу җавап дөрес түгел.';
      $('feedbackText').textContent = correct ? item.basis : `Дөрес җавап: ${item.o[item.a]}. ${item.basis}`;
      $('quizError').classList.add('hidden');
      $('nextQuizBtn').textContent = 'Алга';
      return;
    }
    openText = $('openAnswer').value.trim();
    if (!openText) {
      $('quizError').textContent = 'Ачык биремгә җавап языгыз.';
      $('quizError').classList.remove('hidden');
      return;
    }
    finish();
  });
  $('copyResultBtn').addEventListener('click', async () => {
    const result = `Ислам педагогикасы · ${current.n} нче дәрес — ${current.title}\n${$('resultText').textContent}\nДөрес җавап: ${$('scoreText').textContent}\nБелем: ${$('theoryText').textContent}\nПедагогик хәл: ${$('situationText').textContent}\nАчык җавап: ${openText}`;
    const copied = await copyText(result);
    $('resultCopyNote').textContent = copied ? 'Нәтиҗә күчереп алынды.' : 'Күчертү мөмкин булмады. Нәтиҗәне бу биттән сайлап алыгыз.';
  });
  $('retryBtn').addEventListener('click', () => {
    reviewIndex = quizIndex = 0;
    quizAnswers = [];
    openText = '';
    $('openAnswer').value = '';
    show('intro');
  });
  show(byNumber.has(requested) ? 'intro' : 'home');
})();
