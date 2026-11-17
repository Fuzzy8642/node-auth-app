const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { runMigrations } = require('./config/migrations');
runMigrations();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON и данных форм
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
  secret: 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // для локальной разработки
}));

// Статические файлы (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты авторизации
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Главная страница — редирект на форму входа
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
