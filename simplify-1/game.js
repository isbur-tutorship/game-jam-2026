class AlgebraGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.moves = 0;
        this.selectedTerms = [];
        this.terms = [];
        this.init();
    }

    init() {
        this.generateExpression();
        this.render();
        this.attachEventListeners();
    }

    generateExpression() {
        const variables = ['x', 'y', 'z', 'a', 'b'];
        const termsCount = 8 + this.level * 2; // Увеличение сложности
        this.terms = [];

        // Создаём группы подобных слагаемых
        const groups = Math.min(4 + this.level, 8);
        
        for (let i = 0; i < groups; i++) {
            const variable = variables[i % variables.length];
            const power = Math.random() > 0.5 ? (Math.random() > 0.5 ? 2 : 1) : 0;
            const termsInGroup = 2 + Math.floor(Math.random() * 2); // 2-3 подобных слагаемых

            for (let j = 0; j < termsInGroup; j++) {
                const coefficient = Math.floor(Math.random() * 10) + 1;
                const sign = Math.random() > 0.5 ? 1 : -1;
                
                this.terms.push({
                    coefficient: coefficient * sign,
                    variable: variable,
                    power: power,
                    id: Date.now() + Math.random()
                });
            }
        }

        // Перемешиваем слагаемые
        this.terms = this.shuffleArray(this.terms);
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    formatTerm(term) {
        const { coefficient, variable, power } = term;
        let result = '';

        if (coefficient === 0) return '0';

        const absCoef = Math.abs(coefficient);
        
        if (power === 0) {
            result = String(absCoef);
        } else if (power === 1) {
            result = absCoef === 1 ? variable : `${absCoef}${variable}`;
        } else {
            const coefPart = absCoef === 1 ? '' : String(absCoef);
            result = `${coefPart}${variable}^${power}`;
        }

        return coefficient < 0 ? `-${result}` : result;
    }

    areSimilar(term1, term2) {
        return term1.variable === term2.variable && term1.power === term2.power;
    }

    combinTerms(term1, term2) {
        return {
            coefficient: term1.coefficient + term2.coefficient,
            variable: term1.variable,
            power: term1.power,
            id: Date.now() + Math.random()
        };
    }

    render() {
        const expressionDiv = document.getElementById('expression');
        expressionDiv.innerHTML = '';

        this.terms.forEach((term, index) => {
            if (index > 0) {
                const operator = document.createElement('span');
                operator.className = 'operator';
                operator.textContent = term.coefficient >= 0 ? '+' : '';
                expressionDiv.appendChild(operator);
            }

            const termDiv = document.createElement('div');
            termDiv.className = 'term';
            termDiv.textContent = this.formatTerm(term);
            termDiv.dataset.id = term.id;
            termDiv.addEventListener('click', () => this.selectTerm(term));
            expressionDiv.appendChild(termDiv);
        });

        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }

    selectTerm(term) {
        if (this.selectedTerms.length >= 2) {
            this.clearSelection();
        }

        const index = this.selectedTerms.findIndex(t => t.id === term.id);
        
        if (index !== -1) {
            this.selectedTerms.splice(index, 1);
        } else {
            this.selectedTerms.push(term);
        }

        this.updateSelection();

        if (this.selectedTerms.length === 2) {
            setTimeout(() => this.checkCombination(), 300);
        }
    }

    updateSelection() {
        document.querySelectorAll('.term').forEach(div => {
            const termId = parseFloat(div.dataset.id);
            const isSelected = this.selectedTerms.some(t => t.id === termId);
            div.classList.toggle('selected', isSelected);
        });
    }

    checkCombination() {
        const [term1, term2] = this.selectedTerms;

        if (this.areSimilar(term1, term2)) {
            this.showFeedback(true);
            this.moves++;
            this.score += 10 * this.level;

            // Объединяем слагаемые
            const combined = this.combinTerms(term1, term2);
            
            // Анимация удаления
            const termsToRemove = document.querySelectorAll('.term.selected');
            termsToRemove.forEach(el => el.classList.add('fade-out'));

            setTimeout(() => {
                // Удаляем старые слагаемые
                this.terms = this.terms.filter(t => t.id !== term1.id && t.id !== term2.id);
                
                // Добавляем новое, если коэффициент не 0
                if (combined.coefficient !== 0) {
                    this.terms.push(combined);
                }

                this.selectedTerms = [];
                this.render();

                // Проверка на победу
                if (this.isSimplified()) {
                    this.levelComplete();
                }
            }, 500);
        } else {
            this.showFeedback(false);
            this.clearSelection();
        }
    }

    isSimplified() {
        // Проверяем, остались ли подобные слагаемые
        for (let i = 0; i < this.terms.length; i++) {
            for (let j = i + 1; j < this.terms.length; j++) {
                if (this.areSimilar(this.terms[i], this.terms[j])) {
                    return false;
                }
            }
        }
        return true;
    }

    showFeedback(isCorrect) {
        const messageDiv = document.getElementById('message');
        const termsToMark = document.querySelectorAll('.term.selected');

        if (isCorrect) {
            messageDiv.textContent = '✓ Правильно!';
            messageDiv.style.color = '#28a745';
            termsToMark.forEach(el => el.classList.add('correct'));
        } else {
            messageDiv.textContent = '✗ Эти слагаемые не подобны!';
            messageDiv.style.color = '#dc3545';
            termsToMark.forEach(el => el.classList.add('wrong'));
        }

        setTimeout(() => {
            messageDiv.textContent = '';
            termsToMark.forEach(el => {
                el.classList.remove('correct', 'wrong');
            });
        }, 1500);
    }

    clearSelection() {
        this.selectedTerms = [];
        this.updateSelection();
    }

    levelComplete() {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = `🎉 Уровень ${this.level} пройден!`;
        messageDiv.style.color = '#667eea';
        
        this.score += 50 * this.level;
        this.level++;
        
        setTimeout(() => {
            this.generateExpression();
            this.render();
            messageDiv.textContent = '';
        }, 2000);
    }

    showHint() {
        // Находим пару подобных слагаемых
        for (let i = 0; i < this.terms.length; i++) {
            for (let j = i + 1; j < this.terms.length; j++) {
                if (this.areSimilar(this.terms[i], this.terms[j])) {
                    const terms = document.querySelectorAll('.term');
                    const termDivs = Array.from(terms);
                    
                    termDivs.forEach(div => {
                        const id = parseFloat(div.dataset.id);
                        if (id === this.terms[i].id || id === this.terms[j].id) {
                            div.classList.add('hint');
                            setTimeout(() => div.classList.remove('hint'), 2000);
                        }
                    });
                    return;
                }
            }
        }
    }

    attachEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.clearSelection();
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.level = 1;
            this.score = 0;
            this.moves = 0;
            this.generateExpression();
            this.render();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
            this.score = Math.max(0, this.score - 5);
            document.getElementById('score').textContent = this.score;
        });
    }
}

// Запуск игры
const game = new AlgebraGame();