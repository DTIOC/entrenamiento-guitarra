createFretboard() {
    this.fretboard.innerHTML = '';
    
    const totalHeight = 348; // 6 × 58px
    const stringSpacing = totalHeight / 6; // 58px entre cuerdas
    const pointSize = 38;
    
    // Dibujar trastes (barras metálicas)
    for (let i = 1; i <= 4; i++) {
        const fret = document.createElement('div');
        fret.className = 'fret';
        fret.style.left = `${((4 - i) / 4) * 100}%`;
        this.fretboard.appendChild(fret);
    }
    
    // Dibujar cuerdas y puntos
    for (let string = 6; string >= 1; string--) {
        const stringIndex = 6 - string; // 0, 1, 2, 3, 4, 5
        // Centro de cada cuerda: (stringIndex × 58) + 29
        const stringCenter = (stringIndex * stringSpacing) + (stringSpacing / 2);
        
        const stringLine = document.createElement('div');
        stringLine.className = 'string';
        stringLine.style.top = `${stringCenter}px`;
        this.fretboard.appendChild(stringLine);
        
        for (let fret = 0; fret <= 4; fret++) {
            const point = document.createElement('div');
            point.className = 'fret-point';
            point.dataset.string = string;
            point.dataset.fret = fret;
            
            const leftPercent = ((4 - fret) / 4) * 100;
            point.style.left = `calc(${leftPercent}% - ${pointSize / 2}px)`;
            point.style.top = `${stringCenter - (pointSize / 2)}px`;
            
            point.addEventListener('click', () => this.handleFretClick(string, fret, point));
            this.fretboard.appendChild(point);
        }
    }
}
