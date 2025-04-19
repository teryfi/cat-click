import { mutations, getRandomMutation, activateMutation, deactivateMutation, checkMutationEffects, getActiveMutations } from './mutations.js';

// Основные переменные
let clicks = 0;
let clickMultiplier = 1;
let autoClicks = 0;
let mutationPoints = 0;
let upgrades = {};
const clickCooldown = 50; // Защита от спама (50мс)
let lastClickTime = 0;
let lastClickValue = 0;
let totalClicks = 0;

// Элементы стартового экрана
const startScreen = document.querySelector('.start-screen');
const startButton = document.querySelector('.start-button');
const gameContainer = document.querySelector('.game-container');

// Элементы игры
const counter = document.querySelector('.counter');
const catImage = document.querySelector('.cat-image');
const mutationPointsDisplay = document.querySelector('.mutation-points');
const kingdomIncomeDisplay = document.querySelector('.kingdom-income');
const storedClicksDisplay = document.querySelector('.stored-clicks');
const timeCycleDisplay = document.querySelector('.time-cycle');
const mutationsContainer = document.querySelector('.mutations-container');

// Обработка старта игры
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    updateUI();
});

// Инициализация табов
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Обработка кликов
catImage.addEventListener('click', () => {
    if (Date.now() - lastClickTime < clickCooldown) return;
    lastClickTime = Date.now();

    // Расчет значения клика с учетом множителей
    let clickValue = clickMultiplier;
    
    // Применяем эффекты мутаций
    const mutationEffects = checkMutationEffects(clickValue, autoClicks, totalClicks, lastClickValue, clickMultiplier);
    clickValue = mutationEffects.clicks;
    autoClicks = mutationEffects.autoClicks;
    clickMultiplier = mutationEffects.multiplier;
    
    // Добавление кликов
    clicks += clickValue;
    totalClicks += clickValue;
    lastClickValue = clickValue;
    
    // Проверяем, нужно ли дать новую мутацию
    if (Math.floor(clicks / 100) > mutationPoints) {
        mutationPoints = Math.floor(clicks / 100);
        const newMutation = getRandomMutation();
        if (newMutation) {
            activateMutation(newMutation);
            updateMutationsUI();
            // Показываем уведомление о новой мутации
            showMutationNotification(mutations[newMutation]);
        }
    }
    
    // Обновление интерфейса
    updateUI();
});

// Автоклики
setInterval(() => {
    if (autoClicks > 0) {
        clicks += autoClicks;
        totalClicks += autoClicks;
        updateUI();
    }
}, 1000);

// Показ уведомления о новой мутации
function showMutationNotification(mutation) {
    const notification = document.createElement('div');
    notification.className = 'mutation-notification';
    notification.innerHTML = `
        <h3>Новая мутация!</h3>
        <p>${mutation.name}</p>
        <p>${mutation.description}</p>
    `;
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Обновление UI мутаций
function updateMutationsUI() {
    if (!mutationsContainer) return;
    
    mutationsContainer.innerHTML = '';
    const activeMutations = getActiveMutations();
    
    if (activeMutations.length === 0) {
        mutationsContainer.innerHTML = '<div class="no-mutations">У вас пока нет мутаций. Кликайте больше!</div>';
        return;
    }
    
    activeMutations.forEach(mutation => {
        const mutationElement = document.createElement('div');
        mutationElement.className = 'mutation-card';
        mutationElement.innerHTML = `
            <h3>${mutation.name}</h3>
            <p>${mutation.description}</p>
            <button class="deactivate-mutation">Отключить</button>
        `;
        
        mutationElement.querySelector('.deactivate-mutation').addEventListener('click', () => {
            deactivateMutation(mutation.name);
            updateMutationsUI();
        });
        
        mutationsContainer.appendChild(mutationElement);
    });
}

// Обновление UI
function updateUI() {
    counter.textContent = Math.floor(clicks);
    if (mutationPointsDisplay) mutationPointsDisplay.textContent = `${Math.floor(mutationPoints)}/100`;
    if (kingdomIncomeDisplay) kingdomIncomeDisplay.textContent = `${autoClicks}/сек`;
    if (storedClicksDisplay) storedClicksDisplay.textContent = `0`;
    if (timeCycleDisplay) timeCycleDisplay.textContent = `Ночь`;
    
    // Обновляем цены улучшений
    document.querySelectorAll('.upgrade-card').forEach(card => {
        const type = card.getAttribute('data-type');
        const baseCost = parseInt(card.getAttribute('data-base-cost'));
        const price = Math.floor(baseCost * Math.pow(1.5, upgrades[type] || 0));
        const priceElement = card.querySelector('.upgrade-price');
        if (priceElement) priceElement.textContent = `${price} кликов`;
        
        const button = card.querySelector('.upgrade-btn');
        if (button) button.disabled = clicks < price;
    });
}

// Обработка улучшений
document.querySelectorAll('.upgrade-btn').forEach(button => {
    button.addEventListener('click', () => {
        const card = button.closest('.upgrade-card');
        const type = card.getAttribute('data-type');
        const baseCost = parseInt(card.getAttribute('data-base-cost'));
        const price = Math.floor(baseCost * Math.pow(1.5, upgrades[type] || 0));
        
        if (clicks >= price) {
            clicks -= price;
            upgrades[type] = (upgrades[type] || 0) + 1;
            
            switch(type) {
                case 'laser':
                    clickMultiplier *= 2;
                    break;
                case 'feeder':
                    autoClicks += 1;
                    break;
                case 'trainer':
                    clickMultiplier *= 2;
                    break;
                case 'robot':
                    autoClicks += 5;
                    break;
            }
            
            // Добавляем проверку и обновление UI после покупки улучшения
            if (type === 'feeder' || type === 'robot') {
                console.log(`Автоклики увеличены до: ${autoClicks}/сек`);
                updateUI();
            }
        }
    });
});

// Инициализация только после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    updateMutationsUI();
    
    // Добавляем чит-код для тестирования
    window.addEventListener('keydown', (e) => {
        console.log('Нажата клавиша:', e.key, 'Shift:', e.shiftKey);
        
        if (e.key.toLowerCase() === 'g' && e.shiftKey) {
            clicks += 1000000;
            console.log('Чит-код активирован! +1,000,000 кликов');
            updateUI();
        }
    });

    // Альтернативный способ - кнопка в интерфейсе
    const cheatButton = document.createElement('button');
    cheatButton.textContent = 'Чит-код (Shift+G)';
    cheatButton.style.position = 'fixed';
    cheatButton.style.top = '10px';
    cheatButton.style.right = '10px';
    cheatButton.style.zIndex = '9999';
    cheatButton.onclick = () => {
        clicks += 1000000;
        console.log('Чит-код активирован через кнопку! +1,000,000 кликов');
        updateUI();
    };
    document.body.appendChild(cheatButton);
});