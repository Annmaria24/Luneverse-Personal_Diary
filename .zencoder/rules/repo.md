# Repository Overview

- name: Personal Diary Project
- primary-app: wellness-app (Vite + React)
- styling: CSS modules in src/pages/Styles and src/components/Styles
- routing: react-router-dom
- auth: Firebase Auth
- data: Firestore via services under src/services

## Key Paths
- App root: d:\Personal_Diary_Project\wellness-app
- Pages: d:\Personal_Diary_Project\wellness-app\src\pages
- Page styles: d:\Personal_Diary_Project\wellness-app\src\pages\Styles
- Components: d:\Personal_Diary_Project\wellness-app\src\components
- Component styles: d:\Personal_Diary_Project\wellness-app\src\components\Styles
- Firebase config: d:\Personal_Diary_Project\wellness-app\src\firebase\config.js
- Services: d:\Personal_Diary_Project\wellness-app\src\services

## Conventions
- Prefer readable, maintainable React components.
- CSS variables are declared in CycleTrackerPage.css :root and reused across pages.
- Modals use classes: modal-overlay, symptom-modal, modal-header, modal-content, modal-actions, cancel-btn, save-btn, delete-btn.

## Notable UI Elements
- CycleTrackerPage contains two modals: symptom modal and delete-month confirmation modal.
- Buttons follow pill-shaped, medium-weight typography.

## Testing/Running
- Move to app folder and run: npm install; npm run dev

## Notes
- Keep modal paddings consistent: header/content/actions each have their own padding to avoid edge crowding.