document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const convertBtn = document.getElementById('convert-btn');
    const statusIndicator = document.getElementById('status-indicator');
    const transcriptionDisplay = document.getElementById('transcription-display');
    const soapResults = document.getElementById('soap-results');

    // Content areas
    const soapContents = {
        S: document.getElementById('soap-s-content'),
        O: document.getElementById('soap-o-content'),
        A: document.getElementById('soap-a-content'),
        P: document.getElementById('soap-p-content'),
        U: document.getElementById('soap-u-content')
    };

    // Keyword definitions
    const keywords = {
        S: ['痛い', 'つらい', 'しびれる', 'だるい', '動かしにくい', '不安', '眠れない', '訴え'],
        O: ['ROM', 'MMT', '度', 'cm', 'kg', 'mmHg', '回', '秒', '歩行', '握力', 'バイタル', '腫脹', '熱感', '発赤'],
        A: ['考えられる', '原因', '問題', '改善', '低下', '制限', 'リスク', '評価'],
        P: ['プログラム', '目標', '実施', '継続', '指導', '週', 'セット', '退院', '自主トレ']
    };

    let recognition = null;
    let isRecording = false;
    let finalTranscript = '';

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.interimResults = true; // Show real-time results
        recognition.continuous = true; // Keep recording until stopped

        recognition.onstart = () => {
            isRecording = true;
            statusIndicator.textContent = '🔴 録音中...';
            statusIndicator.classList.add('recording');
            startBtn.disabled = true;
            stopBtn.disabled = false;
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + '。';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            updateTranscriptionDisplay(interimTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            statusIndicator.textContent = `エラー: ${event.error}`;
            statusIndicator.classList.remove('recording');
            stopRecording();
        };

        recognition.onend = () => {
            if (isRecording) {
                // Keep recording active if not explicitly stopped
                recognition.start();
            } else {
                statusIndicator.textContent = '録音完了';
                statusIndicator.classList.remove('recording');
                startBtn.disabled = false;
                stopBtn.disabled = true;
                if (finalTranscript.trim().length > 0) {
                    convertBtn.disabled = false;
                }
                updateTranscriptionDisplay('');
            }
        };

    } else {
        transcriptionDisplay.innerHTML = '<p class="placeholder" style="color:red;">お使いのブラウザはWeb Speech APIをサポートしていません。Chrome等の対応ブラウザをご利用ください。</p>';
        startBtn.disabled = true;
    }

    startBtn.addEventListener('click', () => {
        if (recognition) {
            soapResults.style.display = 'none'; // Hide previous results
            recognition.start();
        }
    });

    stopBtn.addEventListener('click', () => {
        stopRecording();
    });

    convertBtn.addEventListener('click', () => {
        convertToSOAP(finalTranscript);
    });

    function stopRecording() {
        if (recognition && isRecording) {
            isRecording = false;
            recognition.stop();
        }
    }

    function updateTranscriptionDisplay(interim) {
        if (!finalTranscript && !interim) {
            transcriptionDisplay.innerHTML = '<p class="placeholder">音声認識の結果がここに表示されます...</p>';
            return;
        }

        let html = '';
        if (finalTranscript) {
            html += `<span>${finalTranscript}</span>`;
        }
        if (interim) {
            html += `<span class="interim-text">${interim}</span>`;
        }
        transcriptionDisplay.innerHTML = html;
        
        // Auto scroll to bottom
        transcriptionDisplay.scrollTop = transcriptionDisplay.scrollHeight;
    }

    function convertToSOAP(text) {
        // Clear previous content
        Object.values(soapContents).forEach(el => el.innerHTML = '');

        // Split text by punctuation or newline
        const sentences = text.split(/[。.\n]+/).map(s => s.trim()).filter(s => s.length > 0);

        const categorized = { S: [], O: [], A: [], P: [], U: [] };

        sentences.forEach(sentence => {
            let category = 'U'; // Default to unclassified
            // Check in order: S -> O -> A -> P
            if (keywords.S.some(kw => sentence.includes(kw))) {
                category = 'S';
            } else if (keywords.O.some(kw => sentence.includes(kw))) {
                category = 'O';
            } else if (keywords.A.some(kw => sentence.includes(kw))) {
                category = 'A';
            } else if (keywords.P.some(kw => sentence.includes(kw))) {
                category = 'P';
            }
            categorized[category].push(sentence);
        });

        // Display results
        for (const [cat, list] of Object.entries(categorized)) {
            const container = soapContents[cat];
            if (list.length > 0) {
                const ul = document.createElement('ul');
                list.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    ul.appendChild(li);
                });
                container.appendChild(ul);
            } else {
                container.innerHTML = '<p class="placeholder">該当なし</p>';
            }
        }

        soapResults.style.display = 'block';
    }
});
