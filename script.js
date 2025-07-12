const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const forecastItemsContainer = document.querySelector('.forecast-items-container');
const scheduleAlertBtn = document.querySelector('.schedule-alert-btn');
const alertModal = document.querySelector('.alert-modal');
const alertCityName = document.querySelector('.alert-city-name');
const alertTypeCheckboxes = document.querySelectorAll('input[name="alertType"]');
const scheduleAlertConfirmBtn = document.querySelector('.schedule-alert-confirm-btn');
const cancelAlertBtn = document.querySelector('.cancel-alert-btn');
const scheduledAlertsSection = document.querySelector('.scheduled-alerts');
const alertsList = document.querySelector('.alerts-list');
const backToWeatherBtn = document.querySelector('.back-to-weather-btn');

const apiKey = '1a86ceeae9887eebaa68668f73b317a1'; 

let currentCity = '';
let scheduledAlerts = JSON.parse(localStorage.getItem('scheduledAlerts')) || [];
let currentWeatherData = null; 

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            } else {
                console.warn('Notification permission denied.');
            }
        });
    }
}

requestNotificationPermission();

searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

scheduleAlertBtn.addEventListener('click', () => {
    if (currentCity) {
        alertCityName.textContent = currentCity;
        alertModal.style.display = 'flex';
    }
});

cancelAlertBtn.addEventListener('click', () => {
    alertModal.style.display = 'none';
    alertTypeCheckboxes.forEach(checkbox => checkbox.checked = false); 
});

scheduleAlertConfirmBtn.addEventListener('click', () => {
    const selectedAlertTypes = Array.from(alertTypeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    if (selectedAlertTypes.length > 0) {
        const newAlert = {
            city: currentCity,
            types: selectedAlertTypes,
            scheduledAt: new Date().toLocaleString()
        };
        scheduledAlerts.push(newAlert);
        localStorage.setItem('scheduledAlerts', JSON.stringify(scheduledAlerts));
        renderScheduledAlerts();
        alertModal.style.display = 'none';
        alertTypeCheckboxes.forEach(checkbox => checkbox.checked = false);
        showDisplaySection(scheduledAlertsSection); 
    } else {
        alert('Please select at least one alert type.');
    }
});

backToWeatherBtn.addEventListener('click', () => {
    showDisplaySection(weatherInfoSection); 
});


function renderScheduledAlerts() {
    alertsList.innerHTML = '';
    if (scheduledAlerts.length === 0) {
        alertsList.innerHTML = '<p class="regular-txt" style="text-align: center;">No alerts scheduled yet. 😕</p>';
        return;
    }
    scheduledAlerts.forEach((alert, index) => {
        const alertItem = document.createElement('div');
        alertItem.classList.add('alert-item');
        alertItem.innerHTML = `
            <span>${alert.city}: ${alert.types.join(', ')}</span>
            <button class="delete-alert-btn" data-index="${index}"><span class="material-symbols-outlined">delete</span></button>
        `;
        alertsList.appendChild(alertItem);
    });


    document.querySelectorAll('.delete-alert-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const indexToDelete = event.currentTarget.dataset.index;
            scheduledAlerts.splice(indexToDelete, 1);
            localStorage.setItem('scheduledAlerts', JSON.stringify(scheduledAlerts));
            renderScheduledAlerts(); 
        });
    });
}


renderScheduledAlerts();

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    return response.json();
}

function getWeatherIcon(id) {
    if (id >= 200 && id <= 232) return 'thunderstorm.svg'; 
    if (id >= 300 && id <= 321) return 'drizzle.svg'; 
    if (id >= 500 && id <= 531) return 'rain.svg';     
    if (id >= 600 && id <= 622) return 'snow.svg';     
    if (id >= 701 && id <= 781) return 'atmosphere.svg';
    if (id === 800) return 'clear.svg';                
    if (id >= 801 && id <= 804) return 'clouds.svg';   
    return 'clouds.svg'; // Default
}

function getWeatherConditionText(id) {
    if (id >= 200 && id <= 232) return 'Thunderstorm';
    if (id >= 300 && id <= 321) return 'Drizzle';
    if (id >= 500 && id <= 531) return 'Rain';
    if (id >= 600 && id <= 622) return 'Snow';
    if (id >= 701 && id <= 781) return 'Atmosphere';
    if (id === 800) return 'Clear';
    if (id >= 801 && id <= 804) return 'Clouds';
    return 'Unknown';
}


function getCurrentDate() {
    const currentDate = new Date();
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    };
    return currentDate.toLocaleDateString('en-GB', options);
}

async function updateWeatherInfo(city) {
    const weatherData = await getFetchData('weather', city);
    if (weatherData.cod !== 200) {
        showDisplaySection(notFoundSection);
        return;
    }
    currentWeatherData = weatherData; 
    currentCity = weatherData.name;  
    const {
        name: cityName,
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed }
    } = weatherData;

    countryTxt.textContent = cityName; 
    tempTxt.textContent = Math.round(temp) + ' °C';
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = humidity + ' %';
    windValueTxt.textContent = speed + ' M/s';

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    await updateForecastInfo(city);
    showDisplaySection(weatherInfoSection);
    checkAndNotifyAlerts();
}

async function updateForecastInfo(city) {
    const forecastsData = await getFetchData('forecast', city);
    const timeTaken = '12:00:00';
    const todayDate = new Date().toISOString().split('T')[0];
    forecastItemsContainer.innerHTML = '';
    forecastsData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)) {
            updateForecastItems(forecastWeather);
        }
    });
}

function updateForecastItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData;

    const dateTaken = new Date(date);
    const dateOption = {
        day: '2-digit',
        month: 'short'
    };
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>`;

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection, scheduledAlertsSection]
        .forEach(sec => sec.style.display = 'none');
    section.style.display = 'flex';
}

function checkAndNotifyAlerts() {
    if (!currentWeatherData || !scheduledAlerts.length) return;

    const currentCondition = getWeatherConditionText(currentWeatherData.weather[0].id);
    const currentTemp = currentWeatherData.main.temp;

    scheduledAlerts.forEach(alert => {
        const isAlertActive = alert.types.some(type => {
            if (type === currentCondition) {
                return true;
            }
            if (type === 'Extreme Temp') {
      
                return currentTemp > 35 || currentTemp < 0;
            }
            return false;
        });

        if (isAlertActive) {
            sendNotification(`Weather Alert for ${alert.city}`, `Current condition: ${currentCondition}. Temperature: ${Math.round(currentTemp)}°C.`);
      
        }
    });
}

function sendNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: message,
            icon: 'assets/weather/thunderstorm.svg' 
        });

        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

setInterval(() => {
    if (currentCity) { 
        updateWeatherInfo(currentCity); 
    }
}, 5 * 60 * 1000); 
