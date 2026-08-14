class GuitarTrainingApp {
    constructor() {
        this.synth = null;
        this.currentMode = 'notes';
        this.currentExercise = null;
        this.userPositions = [];
        this.webhookURL = 'https://script.google.com/macros/s/AKfycbz4dyyFtNkyHYmkSokJDSx5pmucX2sGqaiRTZxEN4BUzOebSJUDYFVK66DxypNq81Ap/exec';
        
        this.noteDatabase = {
            6: ['Mi2', 'Fa2', 'Fa#2', 'Sol2', 'Sol#2'],
            5: ['La2', 'La#2', 'Si2', 'Do3', 'Do#3'],
            4: ['Re3', 'Re#3', 'Mi3', 'Fa3', 'Fa#3'],
            3: ['Sol3', 'Sol#3', 'La3', 'La#3', 'Si3'],
            2: ['Si3', 'Do4', 'Do#4', 'Re4', 'Re#4'],
            1: ['Mi4', 'Fa4', 'Fa#4', 'Sol4', 'Sol#4']
        };
        
        this.chordDatabase = {
            'Em': {6: 0, 5: 2, 4: 2, 3: 0, 2: 0, 1: 0},
            'E': {6: 0, 5: 2, 4: 2, 3: 1, 2: 0, 1: 0},
            'Am': {6: -1, 5: 0, 4: 2, 3: 2, 2: 1, 1: 0},
            'A': {6: -1, 5: 0, 4: 2, 3: 2, 2: 2, 1: 0},
            'E7': {6: 0, 5: 2, 4: 0, 3: 1, 2: 0, 1: 0},
            'Em7': {6: 0, 5: 2, 4: 0, 3: 0, 2: 0, 1: 0},
            'A7': {6: -1, 5: 0, 4: 2, 3: 0, 2: 2, 1: 0},
            'Am7': {6: -1, 5: 0, 4: 2, 3: 0, 2: 1, 1: 0},
            'D': {6: -1, 5: -1, 4: 0, 3: 2, 2: 3, 1: 2},
            'Dm': {6: -1, 5: -1, 4: 0, 3: 2, 2: 3, 1: 1},
            'D7': {6: -1, 5: -1, 4: 0, 3: 2, 2: 1, 1: 2},
            'Dm7': {6: -1, 5: -1, 4: 0, 3: 2, 2: 1, 1: 1},
            'C': {6: -1, 5: 3, 4: 2, 3: 0, 2: 1, 1: 0},
            'C7': {6: -1, 5: 3, 4: 2, 3: 3, 2: 1, 1: 0},
            'G': {6: 3, 5: 2, 4: 0, 3: 0, 2: 0, 1: 3},
            'G7': {6: 3, 5: 2, 4: 0, 3: 0, 2: 0, 1: 1},
            'F': {6: 1, 5: 3, 4: 3, 3: 2, 2: 1, 1: 1},
            'Fm': {6: 1, 5: 3, 4: 3, 3: 1, 2: 1, 1: 1},
            'F7': {6: 1, 5: 3, 4: 1, 3: 2, 2: 1, 1: 1},
            'Fm7': {6: 1, 5: 3, 4: 1, 3: 1, 2: 1, 1: 1}
        };
        
        this.init();
    }
    
    init() {
        this.createFretboard();
        this.setupEventListeners();
        this.generateNewExercise();
    }
    
    async initAudio() {
        if (!this.synth) {
            await Tone.start();
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sawtooth", harmonicity: 1.2 },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 1.5 },
                volume: -5
            }).toDestination();
            
            const filter = new Tone.Filter(3000, "lowpass").toDestination();
            const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).toDestination();
            this.synth.connect(filter);
            filter.connect(reverb);
        }
    }
    
    createFretboard() {
        // Para cada una de las 6 celdas del diapasón, dibujar:
        // - La línea de la cuerda (centrada verticalmente)
        // - Los 5 puntos interactivos (trastes 0, 1, 2, 3, 4)
        // - Las barras de trastes (solo en la primera celda, para que se vean continuas)
        
        const pointSize = 38;
        
        // Dibujar barras de trastes en la primera celda (se extienden visualmente por todas)
        const firstCell = document.getElementById('fretboard-cell-1');
        for (let i = 1; i <= 4; i++) {
            const fretBar = document.createElement('div');
            fretBar.className = 'fret-bar';
            const leftPercent = ((4 - i) / 4) * 100;
            fretBar.style.left = `calc(${leftPercent}% - 2px)`;
            // La barra debe extenderse por todas las celdas (6 × 58px = 348px)
            fretBar.style.height = '348px';
            fretBar.style.position = 'absolute';
            fretBar.style.top = '0';
            firstCell.appendChild(fretBar);
        }
        
        // Para cada cuerda (6 a 1), dibujar la línea y los puntos
        for (let string = 6; string >= 1; string--) {
            const cellIndex = 6 - string; // 0 para 6ª, 5 para 1ª
            const cell = document.getElementById(`fretboard-cell-${cellIndex + 1}`);
            
            // Línea de la cuerda
            const stringLine = document.createElement('div');
            stringLine.className = 'string-line';
            if (string >= 5) stringLine.classList.add('thick'); // 6ª y 5ª más gruesas
            cell.appendChild(stringLine);
            
            // Puntos interactivos para cada traste
            for (let fret = 0; fret <= 4; fret++) {
                const point = document.createElement('div');
                point.className = 'fret-point';
                point.dataset.string = string;
                point.dataset.fret = fret;
                
                const leftPercent = ((4 - fret) / 4) * 100;
                point.style.left = `calc(${leftPercent}% - ${pointSize / 2}px)`;
                
                point.addEventListener('click', () => this.handleFretClick(string, fret, point));
                cell.appendChild(point);
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('btnModeNotes').addEventListener('click', () => this.setMode('notes'));
        document.getElementById('btnModeChords').addEventListener('click', () => this.setMode('chords'));
        document.getElementById('btnPlay').addEventListener('click', () => this.playExercise());
        document.getElementById('btnGenerate').addEventListener('click', () => this.generateNewExercise());
        document.getElementById('btnCheck').addEventListener('click', () => this.checkExercise());
        document.getElementById('btnClear').addEventListener('click', () => this.clearPositions());
    }
    
    setMode(mode) {
        this.currentMode = mode;
        document.getElementById('btnModeNotes').classList.toggle('active', mode === 'notes');
        document.getElementById('btnModeChords').classList.toggle('active', mode === 'chords');
        this.clearPositions();
        this.generateNewExercise();
    }
    
    generateNewExercise() {
        this.clearPositions();
        
        if (this.currentMode === 'notes') {
            const strings = Object.keys(this.noteDatabase);
            const randomString = strings[Math.floor(Math.random() * strings.length)];
            const notes = this.noteDatabase[randomString];
            const randomFret = Math.floor(Math.random() * notes.length);
            
            this.currentExercise = {
                type: 'note',
                string: parseInt(randomString),
                fret: randomFret,
                note: notes[randomFret]
            };
            
            document.getElementById('exerciseType').textContent = 'Nota suelta';
            document.getElementById('positionInfo').textContent = `${this.currentExercise.note} (Cuerda ${this.currentExercise.string}, Traste ${this.currentExercise.fret})`;
            document.getElementById('instructionText').textContent = 'Haz clic en el punto correcto para pisar la nota';
        } else {
            const chords = Object.keys(this.chordDatabase);
            const randomChord = chords[Math.floor(Math.random() * chords.length)];
            
            this.currentExercise = {
                type: 'chord',
                chord: randomChord,
                positions: this.chordDatabase[randomChord]
            };
            
            document.getElementById('exerciseType').textContent = 'Acorde';
            document.getElementById('positionInfo').textContent = randomChord;
            document.getElementById('instructionText').textContent = 'Coloca los dedos en las posiciones correctas para el acorde';
        }
        
        document.getElementById('feedback').textContent = 'Presiona "Escuchar" para escuchar el ejercicio';
        document.getElementById('scoreDisplay').style.display = 'none';
    }
    
    handleFretClick(string, fret, pointElement) {
        this.initAudio();
        
        if (pointElement.classList.contains('active')) {
            pointElement.classList.remove('active');
            this.userPositions = this.userPositions.filter(p => !(p.string === string && p.fret === fret));
        } else {
            pointElement.classList.add('active');
            this.userPositions.push({string, fret});
            if (this.currentMode === 'notes') {
                const note = this.noteDatabase[string][fret];
                this.playNote(note);
            }
        }
    }
    
    async playNote(noteName) {
        await this.initAudio();
        const noteMap = {
            'Mi2': 'E2', 'Fa2': 'F2', 'Fa#2': 'F#2', 'Sol2': 'G2', 'Sol#2': 'G#2',
            'La2': 'A2', 'La#2': 'A#2', 'Si2': 'B2', 'Do3': 'C3', 'Do#3': 'C#3',
            'Re3': 'D3', 'Re#3': 'D#3', 'Mi3': 'E3', 'Fa3': 'F3', 'Fa#3': 'F#3',
            'Sol3': 'G3', 'Sol#3': 'G#3', 'La3': 'A3', 'La#3': 'A#3', 'Si3': 'B3',
            'Do4': 'C4', 'Do#4': 'C#4', 'Re4': 'D4', 'Re#4': 'D#4',
            'Mi4': 'E4', 'Fa4': 'F4', 'Fa#4': 'F#4', 'Sol4': 'G4', 'Sol#4': 'G#4'
        };
        const toneNote = noteMap[noteName] || noteName;
        this.synth.triggerAttackRelease(toneNote, '8n');
    }
    
    async playExercise() {
        await this.initAudio();
        const feedback = document.getElementById('feedback');
        feedback.textContent = '🎵 Escuchando...';
        feedback.style.color = '#00d9a5';
        
        if (this.currentExercise.type === 'note') {
            this.playNote(this.currentExercise.note);
            setTimeout(() => {
                feedback.textContent = '✅ Ahora coloca el dedo en la posición correcta';
                feedback.style.color = '#fff';
            }, 1000);
        } else {
            const positions = this.currentExercise.positions;
            const notesToPlay = [];
            for (let string = 1; string <= 6; string++) {
                const fret = positions[string];
                if (fret >= 0 && fret <= 4) {
                    const note = this.noteDatabase[string][fret];
                    if(note) notesToPlay.push(note);
                }
            }
            notesToPlay.forEach((note, index) => setTimeout(() => this.playNote(note), index * 50));
            setTimeout(() => {
                feedback.textContent = '✅ Ahora forma el acorde en el diagrama';
                feedback.style.color = '#fff';
            }, 1500);
        }
    }
    
    clearPositions() {
        this.userPositions = [];
        document.querySelectorAll('.fret-point').forEach(point => point.classList.remove('active', 'correct', 'incorrect'));
        document.getElementById('scoreDisplay').style.display = 'none';
    }
    
    checkExercise() {
        const email = document.getElementById('studentEmail').value.trim();
        const name = document.getElementById('studentName').value.trim();
        const group = document.getElementById('studentGroup').value.trim();
        
        if (!email || !name || !group) {
            alert('⚠️ Por favor, completa todos los campos de registro antes de verificar.');
            document.getElementById('studentEmail').focus();
            return;
        }
        if (this.userPositions.length === 0) {
            document.getElementById('feedback').textContent = '⚠️ Primero coloca los dedos en el diagrama';
            return;
        }
        
        const score = this.calculateScore();
        this.showResults(score);
        this.highlightPositions();
        this.saveToGoogleSheets();
    }
    
    calculateScore() {
        let correct = 0;
        let total = 0;
        
        if (this.currentExercise.type === 'note') {
            total = 1;
            const userPos = this.userPositions.find(p => p.string === this.currentExercise.string && p.fret === this.currentExercise.fret);
            if (userPos) correct = 1;
        } else {
            const positions = this.currentExercise.positions;
            const correctPositions = [];
            for (let string = 1; string <= 6; string++) {
                const fret = positions[string];
                if (fret >= 0) { correctPositions.push({string, fret}); total++; }
            }
            this.userPositions.forEach(userPos => {
                if (correctPositions.some(cp => cp.string === userPos.string && cp.fret === userPos.fret)) correct++;
            });
        }
        const percentage = Math.round((correct / total) * 100);
        return { percentage, correct, total };
    }
    
    showResults(score) {
        const scoreDisplay = document.getElementById('scoreDisplay');
        scoreDisplay.style.display = 'block';
        document.getElementById('scoreValue').textContent = score.percentage;
        
        let text = '📚 Sigue practicando, ¡tú puedes!';
        if (score.percentage === 100) text = ' ¡Perfecto! ¡Excelente posición!';
        else if (score.percentage >= 80) text = '👏 ¡Muy bien! Casi perfecto';
        else if (score.percentage >= 60) text = '👍 Bien, sigue practicando';
        else if (score.percentage >= 40) text = '💪 Vas por buen camino, continúa';
        document.getElementById('feedbackText').textContent = text;
        
        document.getElementById('feedback').innerHTML = `Posiciones correctas: ${score.correct}/${score.total}<br><small>Calificación: ${score.percentage}%</small>`;
    }
    
    highlightPositions() {
        document.querySelectorAll('.fret-point').forEach(point => point.classList.remove('correct', 'incorrect'));
        
        if (this.currentExercise.type === 'note') {
            const correctPoint = document.querySelector(`[data-string="${this.currentExercise.string}"][data-fret="${this.currentExercise.fret}"]`);
            if (correctPoint) correctPoint.classList.add('correct');
        } else {
            const positions = this.currentExercise.positions;
            for (let string = 1; string <= 6; string++) {
                const fret = positions[string];
                if (fret >= 0) {
                    const point = document.querySelector(`[data-string="${string}"][data-fret="${fret}"]`);
                    if (point) point.classList.add('correct');
                }
            }
        }
        this.userPositions.forEach(pos => {
            const point = document.querySelector(`[data-string="${pos.string}"][data-fret="${pos.fret}"]`);
            if (point && !point.classList.contains('correct')) point.classList.add('incorrect');
        });
    }
    
    async saveToGoogleSheets() {
        const email = document.getElementById('studentEmail').value.trim();
        const name = document.getElementById('studentName').value.trim();
        const group = document.getElementById('studentGroup').value.trim();
        if (!this.webhookURL) return;
        
        const score = this.calculateScore();
        const data = {
            timestamp: new Date().toISOString(),
            email, name, group,
            exerciseType: this.currentExercise.type,
            exerciseDetail: this.currentExercise.type === 'note' ? this.currentExercise.note : this.currentExercise.chord,
            score: score.percentage,
            correctPositions: score.correct,
            totalPositions: score.total,
            userPositions: this.userPositions.map(p => `C${p.string}T${p.fret}`).join('-')
        };
        
        try {
            await fetch(this.webhookURL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            console.log('✅ Guardado');
        } catch (error) { console.error('Error:', error); }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new GuitarTrainingApp(); });
