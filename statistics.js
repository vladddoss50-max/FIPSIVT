// Статистические функции для клиентской стороны
class StatisticsCalculator {
    
    static parseData(input) {
        return input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
    }
    
    static mean(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }
    
    static variance(data, sample = true) {
        const m = this.mean(data);
        const sum = data.reduce((a, b) => a + Math.pow(b - m, 2), 0);
        return sample ? sum / (data.length - 1) : sum / data.length;
    }
    
    static std(data, sample = true) {
        return Math.sqrt(this.variance(data, sample));
    }
    
    static studentTest(data1, data2) {
        const n1 = data1.length;
        const n2 = data2.length;
        const mean1 = this.mean(data1);
        const mean2 = this.mean(data2);
        const var1 = this.variance(data1);
        const var2 = this.variance(data2);
        
        // Объединенная дисперсия
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
        const t = (mean1 - mean2) / Math.sqrt(pooledVar * (1/n1 + 1/n2));
        
        // Степени свободы
        const df = n1 + n2 - 2;
        
        // p-значение (двустороннее)
        const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
        
        return {
            't-статистика': this.round(t, 4),
            'p-значение': this.round(p, 4),
            'степени свободы': df,
            'среднее 1': this.round(mean1, 4),
            'среднее 2': this.round(mean2, 4),
            'интерпретация': p < 0.05 ? 'Различия статистически значимы' : 'Различия не статистически значимы'
        };
    }
    
    static fisherTest(data1, data2) {
        const var1 = this.variance(data1);
        const var2 = this.variance(data2);
        const f = var1 > var2 ? var1 / var2 : var2 / var1;
        const df1 = data1.length - 1;
        const df2 = data2.length - 1;
        
        // p-значение (двустороннее)
        const p = 2 * Math.min(
            jStat.centralF.cdf(f, df1, df2),
            1 - jStat.centralF.cdf(f, df1, df2)
        );
        
        return {
            'F-статистика': this.round(f, 4),
            'p-значение': this.round(p, 4),
            'дисперсия 1': this.round(var1, 4),
            'дисперсия 2': this.round(var2, 4),
            'интерпретация': p < 0.05 ? 'Дисперсии различаются значимо' : 'Дисперсии не различаются значимо'
        };
    }
    
    static mannWhitneyTest(data1, data2) {
        // Объединяем выборки
        const allData = [...data1.map(val => ({ val, group: 1 })), ...data2.map(val => ({ val, group: 2 }))];
        
        // Сортируем по значению
        allData.sort((a, b) => a.val - b.val);
        
        // Присваиваем ранги
        let rank = 1;
        for (let i = 0; i < allData.length; i++) {
            if (i > 0 && allData[i].val === allData[i-1].val) {
                // Обработка совпадающих значений
                let sumRanks = rank;
                let count = 1;
                while (i + count < allData.length && allData[i + count].val === allData[i].val) {
                    sumRanks += rank + count;
                    count++;
                }
                const avgRank = sumRanks / count;
                for (let j = 0; j < count; j++) {
                    allData[i + j].rank = avgRank;
                }
                i += count - 1;
                rank += count;
            } else {
                allData[i].rank = rank;
                rank++;
            }
        }
        
        // Суммы рангов по группам
        const sumRanks1 = allData.filter(d => d.group === 1).reduce((sum, d) => sum + d.rank, 0);
        const sumRanks2 = allData.filter(d => d.group === 2).reduce((sum, d) => sum + d.rank, 0);
        
        // U-статистики
        const n1 = data1.length;
        const n2 = data2.length;
        const u1 = sumRanks1 - n1 * (n1 + 1) / 2;
        const u2 = sumRanks2 - n2 * (n2 + 1) / 2;
        const u = Math.min(u1, u2);
        
        // Аппроксимация нормальным распределением для больших выборок
        const mu = n1 * n2 / 2;
        const sigma = Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
        const z = (u - mu) / sigma;
        const p = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
        
        return {
            'U-статистика': this.round(u, 4),
            'Z-статистика': this.round(z, 4),
            'p-значение': this.round(p, 4),
            'сумма рангов 1': this.round(sumRanks1, 4),
            'сумма рангов 2': this.round(sumRanks2, 4),
            'интерпретация': p < 0.05 ? 'Различия статистически значимы' : 'Различия не статистически значимы'
        };
    }
    
    static spearmanTest(data1, data2) {
        // Ранжирование данных
        const rank1 = this.rankData(data1);
        const rank2 = this.rankData(data2);
        
        // Коэффициент корреляции Спирмена
        const n = data1.length;
        const diffSq = rank1.map((r, i) => Math.pow(r - rank2[i], 2));
        const sumDiffSq = diffSq.reduce((a, b) => a + b, 0);
        const rho = 1 - (6 * sumDiffSq) / (n * (n * n - 1));
        
        // Проверка значимости
        const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
        const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));
        
        return {
            'Коэффициент корреляции Спирмена': this.round(rho, 4),
            'p-значение': this.round(p, 4),
            'интерпретация': p < 0.05 ? 'Корреляция статистически значима' : 'Корреляция не статистически значима'
        };
    }
    
    static pearsonCorrelation(data1, data2) {
        const n = data1.length;
        const mean1 = this.mean(data1);
        const mean2 = this.mean(data2);
        
        // Вычисление ковариации и стандартных отклонений
        let covariance = 0;
        let std1 = 0;
        let std2 = 0;
        
        for (let i = 0; i < n; i++) {
            const dev1 = data1[i] - mean1;
            const dev2 = data2[i] - mean2;
            covariance += dev1 * dev2;
            std1 += dev1 * dev1;
            std2 += dev2 * dev2;
        }
        
        covariance /= (n - 1);
        std1 = Math.sqrt(std1 / (n - 1));
        std2 = Math.sqrt(std2 / (n - 1));
        
        // Коэффициент корреляции Пирсона
        const r = covariance / (std1 * std2);
        
        // Проверка значимости
        const t = r * Math.sqrt((n - 2) / (1 - r * r));
        const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));
        
        return {
            'Коэффициент корреляции Пирсона': this.round(r, 4),
            'p-значение': this.round(p, 4),
            'ковариация': this.round(covariance, 4),
            'интерпретация': p < 0.05 ? 'Корреляция статистически значима' : 'Корреляция не статистически значима'
        };
    }
    
    static anovaOneWay(groups) {
        const k = groups.length;
        const n = groups.map(g => g.length);
        const totalN = n.reduce((a, b) => a + b, 0);
        
        // Общее среднее
        const allData = groups.flat();
        const grandMean = this.mean(allData);
        
        // Сумма квадратов между группами (SSB)
        let ssb = 0;
        groups.forEach((group, i) => {
            const groupMean = this.mean(group);
            ssb += n[i] * Math.pow(groupMean - grandMean, 2);
        });
        
        // Сумма квадратов внутри групп (SSW)
        let ssw = 0;
        groups.forEach((group, i) => {
            const groupMean = this.mean(group);
            group.forEach(val => {
                ssw += Math.pow(val - groupMean, 2);
            });
        });
        
        // Средние квадраты
        const msb = ssb / (k - 1);
        const msw = ssw / (totalN - k);
        
        // F-статистика
        const f = msb / msw;
        
        // p-значение
        const p = 1 - jStat.centralF.cdf(f, k - 1, totalN - k);
        
        return {
            'F-статистика': this.round(f, 4),
            'p-значение': this.round(p, 4),
            'степени свободы (между)': k - 1,
            'степени свободы (внутри)': totalN - k,
            'сумма квадратов (между)': this.round(ssb, 4),
            'сумма квадратов (внутри)': this.round(ssw, 4),
            'интерпретация': p < 0.05 ? 'Есть статистически значимые различия между группами' : 'Нет статистически значимых различий между группами'
        };
    }
    
    static bartlettTest(groups) {
        const k = groups.length;
        const n = groups.map(g => g.length);
        const totalN = n.reduce((a, b) => a + b, 0);
        
        // Выборочные дисперсии
        const variances = groups.map(g => this.variance(g));
        
        // Объединенная дисперсия
        let pooledVar = 0;
        for (let i = 0; i < k; i++) {
            pooledVar += (n[i] - 1) * variances[i];
        }
        pooledVar /= (totalN - k);
        
        // Статистика критерия Бартлета
        let numerator = (totalN - k) * Math.log(pooledVar);
        for (let i = 0; i < k; i++) {
            numerator -= (n[i] - 1) * Math.log(variances[i]);
        }
        
        const denominator = 1 + (1 / (3 * (k - 1))) * 
            (groups.reduce((sum, group, i) => sum + 1/(n[i] - 1) - 1/(totalN - k), 0));
        
        const chi2 = numerator / denominator;
        
        // p-значение
        const p = 1 - jStat.chisquare.cdf(chi2, k - 1);
        
        return {
            'Статистика критерия': this.round(chi2, 4),
            'p-значение': this.round(p, 4),
            'степени свободы': k - 1,
            'интерпретация': p < 0.05 ? 'Дисперсии различаются значимо' : 'Дисперсии не различаются значимо'
        };
    }
    
    static hortleyTest(groups) {
        // Объединяем все данные
        const allData = groups.flat();
        
        // Вычисляем квартили
        const sorted = [...allData].sort((a, b) => a - b);
        const q1 = this.percentile(sorted, 25);
        const q3 = this.percentile(sorted, 75);
        const iqr = q3 - q1;
        
        // Границы выбросов
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        // Находим выбросы в каждой группе
        const outliers = groups.map((group, index) => {
            const groupOutliers = group.filter(val => val < lowerBound || val > upperBound);
            return {
                группа: index + 1,
                выбросы: groupOutliers,
                количество: groupOutliers.length
            };
        });
        
        return {
            'Q1 (25-й процентиль)': this.round(q1, 4),
            'Q3 (75-й процентиль)': this.round(q3, 4),
            'IQR (межквартильный размах)': this.round(iqr, 4),
            'Нижняя граница выбросов': this.round(lowerBound, 4),
            'Верхняя граница выбросов': this.round(upperBound, 4),
            'Выбросы по группам': outliers
        };
    }
    
    static cochranTest(groups) {
        // Для бинарных данных (0 и 1)
        // Преобразуем данные, если они не бинарные
        const binaryGroups = groups.map(group => 
            group.map(val => val > this.mean(group) ? 1 : 0)
        );
        
        const k = binaryGroups.length;
        const n = binaryGroups[0].length; // предполагаем одинаковый размер выборок
        
        // Суммы по группам
        const sums = binaryGroups.map(group => 
            group.reduce((sum, val) => sum + val, 0)
        );
        
        // Общая сумма
        const totalSum = sums.reduce((a, b) => a + b, 0);
        
        // Суммы квадратов
        const sumSquares = sums.reduce((sum, s) => sum + s * s, 0);
        
        // Статистика Кочрена
        const q = (k * (k - 1) * sumSquares - (k - 1) * totalSum * totalSum) / 
                 (k * totalSum - totalSum * totalSum);
        
        // p-значение (хи-квадрат с k-1 степенями свободы)
        const p = 1 - jStat.chisquare.cdf(q, k - 1);
        
        return {
            'Статистика критерия Кочрена': this.round(q, 4),
            'p-значение': this.round(p, 4),
            'степени свободы': k - 1,
            'интерпретация': p < 0.05 ? 'Различия между группами статистически значимы' : 'Различия не статистически значимы'
        };
    }
    
    static siegelTukeyTest(data1, data2) {
        // Объединяем выборки
        const combined = [...data1.map(val => ({ val, group: 1 })), ...data2.map(val => ({ val, group: 2 }))];
        
        // Сортируем по значению
        combined.sort((a, b) => a.val - b.val);
        
        // Присваиваем ранги по методу Сиджела-Тьюки
        const n = combined.length;
        const ranks = [];
        
        for (let i = 0; i < n; i++) {
            if (i % 2 === 0) {
                // Четные позиции получают возрастающие ранги
                ranks.push(Math.floor(i / 2) + 1);
            } else {
                // Нечетные позиции получают убывающие ранги
                ranks.push(n - Math.floor(i / 2));
            }
        }
        
        // Применяем ранги к данным
        combined.forEach((item, i) => {
            item.rank = ranks[i];
        });
        
        // Суммы рангов по группам
        const sumRanks1 = combined.filter(d => d.group === 1).reduce((sum, d) => sum + d.rank, 0);
        const sumRanks2 = combined.filter(d => d.group === 2).reduce((sum, d) => sum + d.rank, 0);
        
        // Аппроксимация U-критерием Манна-Уитни
        const n1 = data1.length;
        const n2 = data2.length;
        const u1 = sumRanks1 - n1 * (n1 + 1) / 2;
        const u2 = sumRanks2 - n2 * (n2 + 1) / 2;
        const u = Math.min(u1, u2);
        
        // Аппроксимация нормальным распределением
        const mu = n1 * n2 / 2;
        const sigma = Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
        const z = (u - mu) / sigma;
        const p = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
        
        return {
            'U-статистика': this.round(u, 4),
            'Z-статистика': this.round(z, 4),
            'p-значение': this.round(p, 4),
            'сумма рангов 1': this.round(sumRanks1, 4),
            'сумма рангов 2': this.round(sumRanks2, 4),
            'интерпретация': p < 0.05 ? 'Различия в дисперсиях статистически значимы' : 'Различия в дисперсиях не статистически значимы'
        };
    }
    
    // Вспомогательные методы
    static rankData(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const ranks = data.map(val => {
            const firstIndex = sorted.indexOf(val);
            const lastIndex = sorted.lastIndexOf(val);
            if (firstIndex === lastIndex) {
                return firstIndex + 1;
            } else {
                // Средний ранг для совпадающих значений
                return (firstIndex + lastIndex + 2) / 2;
            }
        });
        return ranks;
    }
    
    static percentile(sortedData, p) {
        const index = (p / 100) * (sortedData.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
            return sortedData[lower];
        }
        
        const weight = index - lower;
        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }
    
    static round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }
}