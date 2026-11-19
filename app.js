const express = require('express');
const session = require('express-session');
const path = require('path');

// 1. СНАЧАЛА запускаем миграции (до импорта роутов и моделей!)
const { runMigrations } = require('./config/migrations');
runMigrations();

// 2. ТЕПЕРЬ подключаем маршруты (внутри которых грузятся модели)
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
