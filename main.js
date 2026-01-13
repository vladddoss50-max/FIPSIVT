// Управление интерфейсом
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация для страниц критериев
    if (document.getElementById('calculate-btn')) {
        initializeCriteriaPage();
    }
    
    // Добавление обработчиков событий
    addEventListeners();
});

function initializeCriteriaPage() {
    // Определяем критерий из URL
    const path = window.location.pathname;
    const criteriaName = path.split('/').pop().replace('.html', '');
    window.currentCriteria = criteriaName;
    
    // Загружаем пример данных
    const exampleBtn = document.getElementById('example-btn');
    if (exampleBtn) {
        exampleBtn.addEventListener('click', function() {
            loadExampleData(criteriaName);
        });
    }
    
    // Кнопка расчета
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            calculateCriteria(criteriaName);
        });
    }
    
    // Кнопка очистки
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
    
    // Управление группами
    const addGroupBtn = document.getElementById('add-group');
    const removeGroupBtn = document.getElementById('remove-group');
    
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', addGroup);
    }
    
    if (removeGroupBtn) {
        removeGroupBtn.addEventListener('click', removeGroup);
    }
}

function addEventListeners() {
    // Общие обработчики событий
}

function addGroup() {
    const groupsContainer = document.getElementById('groups-container');
    const groupCount = document.querySelectorAll('.group-input').length;
    
    const newGroup = document.createElement('div');
    newGroup.className = 'group-input';
    newGroup.innerHTML = `
        <label>Группа ${groupCount + 1}:</label>
        <textarea class="group-data" rows="3" placeholder="Пример: 12.5, 14.3, 15.2, 13.8"></textarea>
    `;
    
    groupsContainer.appendChild(newGroup);
    
    // Активируем кнопку удаления
    const removeBtn = document.getElementById('remove-group');
    if (removeBtn) {
        removeBtn.disabled = false;
    }
}

function removeGroup() {
    const groups = document.querySelectorAll('.group-input');
    if (groups.length > 2) {
        groups[groups.length - 1].remove();
        
        // Деактивируем кнопку, если осталось 2 группы
        if (groups.length - 1 === 2) {
            const removeBtn = document.getElementById('remove-group');
            if (removeBtn) {
                removeBtn.disabled = true;
            }
        }
    }
}

function loadExampleData(criteriaName) {
    const examples = {
        'student': {
            data1: '12.5, 14.3, 15.2, 13.8, 16.1, 14.9, 13.5, 15.8',
            data2: '10.8, 11.5, 12.9, 11.2, 13.4, 12.1, 11.8, 12.7'
        },
        'fisher': {
            data1: '12.5, 14.3, 15.2, 13.8, 16.1, 14.9',
            data2: '10.8, 11.5, 12.9, 11.2, 13.4, 12.1'
        },
        'mann-whitney': {
            data1: '12, 15, 18, 14, 16, 13, 17',
            data2: '8, 10, 9, 11, 12, 10, 9'
        },
        'spearman': {
            data1: '1, 2, 3, 4, 5, 6, 7, 8',
            data2: '2, 3, 1, 5, 4, 8, 6, 7'
        },
        'pearson': {
            data1: '1, 2, 3, 4, 5, 6, 7, 8',
            data2: '2, 4, 5, 4, 5, 7, 8, 9'
        },
        'siegel-tukey': {
            data1: '12, 15, 18, 14, 16, 13',
            data2: '8, 10, 9, 11, 12, 10'
        },
        'anova': {
            groups: [
                '12.5, 14.3, 15.2, 13.8',
                '10.8, 11.5, 12.9, 11.2',
                '9.5, 10.2, 8.9, 9.8'
            ]
        },
        'bartlett': {
            groups: [
                '12.5, 14.3, 15.2, 13.8',
                '10.8, 11.5, 12.9, 11.2',
                '9.5, 10.2, 8.9, 9.8'
            ]
        },
        'hortley': {
            groups: [
                '12.5, 14.3, 15.2, 13.8, 25.0',
                '10.8, 11.5, 12.9, 11.2, 30.5',
                '9.5, 10.2, 8.9, 9.8, 12.0'
            ]
        },
        'cochran': {
            groups: [
                '1, 0, 1, 1, 0, 1',
                '0, 1, 0, 0, 1, 0',
                '1, 1, 1, 0, 0, 1'
            ]
        }
    };
    
    if (examples[criteriaName]) {
        const data = examples[criteriaName];
        
        if (data.data1 && data.data2) {
            document.getElementById('data1').value = data.data1;
            document.getElementById('data2').value = data.data2;
        } else if (data.groups) {
            const groups = document.querySelectorAll('.group-data');
            data.groups.forEach((groupData, index) => {
                if (groups[index]) {
                    groups[index].value = groupData;
                }
            });
        }
    }
}

function clearForm() {
    // Очищаем все текстовые поля
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.value = '';
    });
    
    // Скрываем результаты
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    // Удаляем график
    const plotContainer = document.getElementById('plot-container');
    if (plotContainer) {
        plotContainer.innerHTML = '';
    }
}

async function calculateCriteria(criteriaName) {
    const calculateBtn = document.getElementById('calculate-btn');
    const originalText = calculateBtn.innerHTML;
    
    try {
        // Показываем индикатор загрузки
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вычисление...';
        calculateBtn.disabled = true;
        
        let result;
        
        if (['student', 'fisher', 'mann-whitney', 'spearman', 'pearson', 'siegel-tukey'].includes(criteriaName)) {
            const data1Input = document.getElementById('data1').value.trim();
            const data2Input = document.getElementById('data2').value.trim();
            
            if (!data1Input || !data2Input) {
                throw new Error('Пожалуйста, заполните оба поля с данными');
            }
            
            const data1 = StatisticsCalculator.parseData(data1Input);
            const data2 = StatisticsCalculator.parseData(data2Input);
            
            if (data1.length < 2 || data2.length < 2) {
                throw new Error('Каждая выборка должна содержать как минимум 2 значения');
            }
            
            switch(criteriaName) {
                case 'student':
                    result = StatisticsCalculator.studentTest(data1, data2);
                    break;
                case 'fisher':
                    result = StatisticsCalculator.fisherTest(data1, data2);
                    break;
                case 'mann-whitney':
                    result = StatisticsCalculator.mannWhitneyTest(data1, data2);
                    break;
                case 'spearman':
                    if (data1.length !== data2.length) {
                        throw new Error('Выборки должны иметь одинаковый размер');
                    }
                    result = StatisticsCalculator.spearmanTest(data1, data2);
                    break;
                case 'pearson':
                    if (data1.length !== data2.length) {
                        throw new Error('Выборки должны иметь одинаковый размер');
                    }
                    result = StatisticsCalculator.pearsonCorrelation(data1, data2);
                    break;
                case 'siegel-tukey':
                    result = StatisticsCalculator.siegelTukeyTest(data1, data2);
                    break;
            }
            
            // Создаем график
            createChart(data1, data2, criteriaName);
            
        } else if (['anova', 'bartlett', 'hortley', 'cochran'].includes(criteriaName)) {
            const groupElements = document.querySelectorAll('.group-data');
            const groups = [];
            
            groupElements.forEach((element, index) => {
                const value = element.value.trim();
                if (value) {
                    const data = StatisticsCalculator.parseData(value);
                    if (data.length >= 2) {
                        groups.push(data);
                    }
                }
            });
            
            if (groups.length < 2) {
                throw new Error('Пожалуйста, введите данные как минимум для двух групп');
            }
            
            switch(criteriaName) {
                case 'anova':
                    result = StatisticsCalculator.anovaOneWay(groups);
                    break;
                case 'bartlett':
                    result = StatisticsCalculator.bartlettTest(groups);
                    break;
                case 'hortley':
                    result = StatisticsCalculator.hortleyTest(groups);
                    break;
                case 'cochran':
                    result = StatisticsCalculator.cochranTest(groups);
                    break;
            }
            
            // Создаем график для нескольких групп
            createGroupChart(groups, criteriaName);
        }
        
        // Отображаем результаты
        displayResults(result, criteriaName);
        
    } catch (error) {
        alert('Ошибка: ' + error.message);
        console.error('Ошибка расчета:', error);
    } finally {
        // Восстанавливаем кнопку
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
    }
}

function displayResults(result, criteriaName) {
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');
    
    // Форматируем результаты
    let html = '<div class="results-grid">';
    
    for (const [key, value] of Object.entries(result)) {
        if (key === 'Выбросы по группам' || key === 'выбросы по группам') {
            html += `<div class="result-item">
                <span class="result-key">${key}:</span>
                <div class="result-value">`;
            
            value.forEach(group => {
                const outliers = group.выбросы ? group.выбросы.map(v => StatisticsCalculator.round(v, 2)).join(', ') : 'нет';
                html += `<div>Группа ${group.группа || group.группа}: ${outliers} (${group.количество})</div>`;
            });
            
            html += `</div></div>`;
        } else {
            html += `<div class="result-item">
                <span class="result-key">${key}:</span>
                <span class="result-value">${value}</span>
            </div>`;
        }
    }
    
    html += '</div>';
    resultsContent.innerHTML = html;
    
    // Показываем секцию с результатами
    resultsSection.style.display = 'block';
    
    // Прокручиваем к результатам
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createChart(data1, data2, criteriaName) {
    const plotContainer = document.getElementById('plot-container');
    plotContainer.innerHTML = '<canvas id="dataChart"></canvas>';
    
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'boxplot',
        data: {
            labels: ['Выборка 1', 'Выборка 2'],
            datasets: [{
                label: 'Распределение данных',
                backgroundColor: 'rgba(52, 152, 219, 0.5)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
                data: [data1, data2]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Диаграмма размаха (Box Plot)'
                }
            }
        }
    });
}

function createGroupChart(groups, criteriaName) {
    const plotContainer = document.getElementById('plot-container');
    plotContainer.innerHTML = '<canvas id="groupChart"></canvas>';
    
    const ctx = document.getElementById('groupChart').getContext('2d');
    const labels = groups.map((_, i) => `Группа ${i + 1}`);
    
    new Chart(ctx, {
        type: 'boxplot',
        data: {
            labels: labels,
            datasets: [{
                label: 'Распределение по группам',
                backgroundColor: 'rgba(52, 152, 219, 0.5)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
                data: groups
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Сравнение распределений по группам'
                }
            }
        }
    });
}