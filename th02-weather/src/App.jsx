import { useState, useEffect } from 'react';
import './App.css';

// Danh sách 8 thành phố Việt Nam với tọa độ chuẩn theo đề bài
const CITIES = [
  { name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { name: 'Huế', lat: 16.4637, lon: 107.5909 },
  { name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
];

// Hàm giải mã weather_code từ API sang biểu tượng và mô tả tiếng Việt
function getWeatherInfo(code) {
  if (code === 0) return { icon: '☀️', text: 'Trời quang', theme: 'sunny' };
  if (code >= 1 && code <= 3) return { icon: '⛅', text: 'Nhiều mây', theme: 'sunny' };
  if (code >= 45 && code <= 48) return { icon: '🌫️', text: 'Sương mù', theme: 'rainy' };
  if (code >= 51 && code <= 67) return { icon: '🌧️', text: 'Có mưa', theme: 'rainy' };
  if (code >= 71 && code <= 77) return { icon: '❄️', text: 'Tuyết rơi', theme: 'rainy' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', text: 'Mưa rào', theme: 'rainy' };
  if (code >= 95) return { icon: '⛈️', text: 'Giông bão', theme: 'stormy' };
  return { icon: '🌡️', text: 'Bình thường', theme: 'sunny' };
}

// Hàm bỏ dấu tiếng Việt hỗ trợ tìm kiếm nâng cao
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function App() {
  const [selectedCity, setSelectedCity] = useState(null); // Ban đầu ở trạng thái "Chưa chọn" (YC4)
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false); // YC5: Đổi C / F không gọi lại API
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('fav_cities');
    return saved ? JSON.parse(saved) : [];
  });

  // Lưu danh sách yêu thích vào localStorage (Nâng cao)
  useEffect(() => {
    localStorage.setItem('fav_cities', JSON.stringify(favorites));
  }, [favorites]);

  const fetchWeather = async (city) => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể kết nối đến máy chủ thời tiết.');
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCity) {
      fetchWeather(selectedCity);
    }
  }, [selectedCity]);

  // YC5: Hàm quy đổi nhiệt độ trực tiếp bằng công thức toán học, không gọi lại API
  const formatTemp = (celsius) => {
    if (celsius === undefined || celsius === null) return '--';
    if (isFahrenheit) {
      return `${((celsius * 9) / 5 + 32).toFixed(1)} °F`;
    }
    return `${celsius.toFixed(1)} °C`;
  };

  // Định dạng thứ và ngày cho dự báo 7 ngày (YC3)
  const formatDayAndDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[date.getDay()];
    const dayMonth = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { dayName, dayMonth };
  };

  const toggleFavorite = (e, cityName) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(cityName) ? prev.filter((c) => c !== cityName) : [...prev, cityName]
    );
  };

  const filteredCities = CITIES.filter((c) =>
    removeAccents(c.name).includes(removeAccents(searchTerm))
  );

  const currentTheme = weatherData
    ? getWeatherInfo(weatherData.current.weather_code).theme
    : 'sunny';

  return (
    <div className={`app-wrapper ${currentTheme}`}>
      <div className="container">
        <header className="header">
          <h1>🌤️ Thời Tiết Việt Nam (TH02)</h1>
          {/* YC5: Nút chuyển đổi °C / °F */}
          <button className="unit-btn" onClick={() => setIsFahrenheit(!isFahrenheit)}>
            Đổi sang {isFahrenheit ? '°C (Celsius)' : '°F (Fahrenheit)'}
          </button>
        </header>

        <div className="main-layout">
          {/* Cột trái: Danh sách 8 thành phố (YC1) */}
          <aside className="sidebar">
            <h3 style={{ marginBottom: '12px' }}>Danh sách thành phố</h3>
            <input
              type="text"
              className="search-box"
              placeholder="Tìm thành phố (không dấu)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="city-list">
              {filteredCities.map((city) => {
                const isSelected = selectedCity?.name === city.name;
                const isFav = favorites.includes(city.name);
                return (
                  <div
                    key={city.name}
                    className={`city-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedCity(city)}
                  >
                    <span>{city.name}</span>
                    <button
                      className="fav-btn"
                      onClick={(e) => toggleFavorite(e, city.name)}
                      title="Yêu thích"
                    >
                      {isFav ? '⭐' : '☆'}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Cột phải: Nội dung chi tiết thời tiết */}
          <main className="content-card">
            {/* YC4: Trạng thái Chưa chọn */}
            {!selectedCity && (
              <div className="status-box">
                <h2>👈 Vui lòng chọn một thành phố bên trái để xem thời tiết</h2>
              </div>
            )}

            {/* YC4: Trạng thái Đang tải */}
            {selectedCity && loading && (
              <div className="status-box">
                <h2>⏳ Đang tải dữ liệu thời tiết cho {selectedCity.name}...</h2>
              </div>
            )}

            {/* YC4: Trạng thái Lỗi (có nút Thử lại) */}
            {selectedCity && !loading && error && (
              <div className="status-box">
                <h2 style={{ color: '#ef4444' }}>⚠️ Lỗi: {error}</h2>
                <button className="retry-btn" onClick={() => fetchWeather(selectedCity)}>
                  🔄 Thử lại
                </button>
              </div>
            )}

            {/* YC2 & YC3: Hiển thị thời tiết hiện tại và dự báo 7 ngày */}
            {selectedCity && !loading && !error && weatherData && (
              <div>
                <div className="current-weather">
                  <div>
                    <h2>{selectedCity.name}</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                      Thời điểm cập nhật: {weatherData.current.time.replace('T', ' ')}
                    </p>
                  </div>

                  <div className="temp-hero">
                    <span className="weather-icon-big">
                      {getWeatherInfo(weatherData.current.weather_code).icon}
                    </span>
                    <div>
                      <div className="temp-value">
                        {formatTemp(weatherData.current.temperature_2m)}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#475569' }}>
                        {getWeatherInfo(weatherData.current.weather_code).text}
                      </div>
                    </div>
                  </div>

                  <div className="weather-details">
                    <div>💧 <strong>Độ ẩm:</strong> {weatherData.current.relative_humidity_2m}%</div>
                    <div>💨 <strong>Tốc độ gió:</strong> {weatherData.current.wind_speed_10m} km/h</div>
                  </div>
                </div>

                <div>
                  <h3>📅 Dự báo 7 ngày tới</h3>
                  <div className="forecast-grid">
                    {weatherData.daily.time.map((dateStr, index) => {
                      const { dayName, dayMonth } = formatDayAndDate(dateStr);
                      const dayWeather = getWeatherInfo(weatherData.daily.weather_code[index]);
                      const maxTemp = weatherData.daily.temperature_2m_max[index];
                      const minTemp = weatherData.daily.temperature_2m_min[index];

                      return (
                        <div key={dateStr} className="forecast-item">
                          <div className="forecast-day">{dayName}</div>
                          <div className="forecast-date">{dayMonth}</div>
                          <div className="forecast-icon" title={dayWeather.text}>
                            {dayWeather.icon}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {dayWeather.text}
                          </div>
                          <div className="forecast-temps">
                            <span className="temp-max" title="Cao nhất">
                              ↑{formatTemp(maxTemp)}
                            </span>
                            <br />
                            <span className="temp-min" title="Thấp nhất">
                              ↓{formatTemp(minTemp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;