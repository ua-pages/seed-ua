# 🌱 Seed

Вдихни життя у свої вебпроєкти.

**[Відкрити живе демо →](https://ua-pages.github.io/seed-ua/)**

Seed — це легкий CLI, який додає цифрове насіння (seed) у ваш вебпроєкт. Він дає застосунку мінімальну ідентичність під час виконання — не контролюючи його, не збираючи даних і не залежачи від зовнішніх сервісів.

## Встановлення

```bash
git clone https://github.com/dev-pets/seed.git
cd seed
npm link
```

Після цього команда `seed` буде доступна глобально.

## Використання

```bash
seed ~/dev-pets-UA/terminosfera-ua
```

```
terminosfera-ua is alive.
```

## Команди

```
seed <шлях-до-проєкту>           Посадити насіння в проєкт
seed status <шлях-до-проєкту>    Показати статус насіння
seed inspect <шлях-до-проєкту>   Перевірити встановлення насіння
seed die <шлях-до-проєкту>       Завершити життя й створити надгробок
seed <шлях-до-проєкту> --commit  Посадити та закомітити в git
seed <шлях-до-проєкту> --push    Посадити, закомітити та запушити
```

## Завершення життя

```bash
seed die ~/мій-проєкт \
  --reason "Проєкт замінено новою версією" \
  --note "Його роботу завершено"
```

Seed створить `.seed/legacy.json` і статичну сторінку `memorial.html`. Він нічого не видаляє.

## Приватність

Seed ніколи не збирає персональні дані, не записує дії користувача, не надсилає телеметрію та не робить мережевих запитів. Усі дані виконання зберігаються лише в localStorage браузера.

> Seed пам'ятає життя застосунку, але не стежить за життям користувача.

## Runtime API

Після посадки у браузері стає доступним `window.seed`:

```js
seed.identity     // { name, species, environment, plantedAt }
seed.life         // { awakenings, runtimeAge, totalAge, heartbeat, state }
seed.memory       // { remember, all, latest, first, count, clear }
seed.components   // { born, all, has, count }
seed.stage        // 'seed' | 'sprout' | 'grow'
seed.snapshot()   // full current state
seed.life.sleep() // put runtime to sleep
seed.life.wake()  // awaken runtime
seed.die(reason, note) // end local runtime life
seed.legacy       // final local record after death
```

Події: `seed:awake`, `seed:sleep`, `seed:heartbeat`, `seed:remember`, `seed:born`.

### Browser CLI

Відкрийте DevTools Console:

```js
seed.help()
seed.status()
seed.remember('Перший реліз')
seed.sleep()
seed.wake()
seed.die('Проєкт завершено')
seed.legacy
```

## Обмеження MVP

- Підтримуються лише ванільні HTML/JS проєкти
- Немає адаптерів для фреймворків
- Статус показує дані маніфесту; дані виконання — лише в браузері
- Потрібен Node.js 20+

---

# 🌱 Seed

Plant life into your web projects.

Seed is a lightweight CLI that adds a digital seed to an existing web project. It gives the application a minimal runtime identity — without controlling it, collecting data, or depending on external services.

## Installation

```bash
git clone https://github.com/dev-pets/seed.git
cd seed
npm link
```

After this, the `seed` command is available globally.

## Usage

```bash
seed ~/dev-pets-UA/terminosfera-ua
```

```
terminosfera-ua is alive.
```

## Commands

```
seed <project-path>               Plant seed into project
seed status <project-path>        Show seed status
seed inspect <project-path>       Inspect seed installation
seed die <project-path>           End life and create a memorial
seed <project-path> --commit      Plant and commit with git
seed <project-path> --push        Plant, commit and push
```

## End of life

```bash
seed die ~/my-project \
  --reason "The project was replaced" \
  --note "Its work is complete"
```

Seed creates `.seed/legacy.json` and a static `memorial.html` page. It never deletes the project.

## Privacy

Seed never collects personal data, records user input, sends telemetry, or makes network requests. All runtime data stays in the browser's localStorage.

> Seed remembers the life of the application, but does not watch the life of the user.

## Runtime API

After planting, `window.seed` is available in the browser:

```js
seed.identity     // { name, species, environment, plantedAt }
seed.life         // { awakenings, runtimeAge, totalAge, heartbeat, state }
seed.memory       // { remember, all, latest, first, count, clear }
seed.components   // { born, all, has, count }
seed.stage        // 'seed' | 'sprout' | 'grow'
seed.snapshot()   // full current state
seed.life.sleep() // put runtime to sleep
seed.life.wake()  // awaken runtime
seed.die(reason, note) // end local runtime life
seed.legacy       // final local record after death
```

Events: `seed:awake`, `seed:sleep`, `seed:heartbeat`, `seed:remember`, `seed:born`.

### Browser CLI

Open the DevTools Console:

```js
seed.help()
seed.status()
seed.remember('First release')
seed.sleep()
seed.wake()
seed.die('The project is complete')
seed.legacy
```

## MVP limitations

- Supports vanilla HTML/JS projects only
- No framework-specific adapters
- Status shows manifest data; runtime data only in browser
- Node.js 20+ required

---

## License

MIT
