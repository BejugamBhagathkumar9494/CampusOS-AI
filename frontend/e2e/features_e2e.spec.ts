import { test, expect } from '@playwright/test';

test.describe('CampusOS AI - AI Exam Preparation & RepoDNA E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to local frontend and initialize student auth state
    await page.goto('http://127.0.0.1:5173');
    await page.evaluate(() => {
      const studentProfile = {
        id: '1',
        email: 'arjun.student@campus.edu',
        full_name: 'Arjun Student',
        role: 'student',
        institution_id: 'STU001',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('campusos_mock_user', JSON.stringify(studentProfile));
      localStorage.setItem('campusos_token', 'mock_jwt_token_for_playwright_test');
    });
  });

  test('Feature 1: AI Exam Preparation - Create Subject Collection & Navigate Tabs', async ({ page }) => {
    // 1. Visit Exam Prep Page
    await page.goto('http://127.0.0.1:5173/student/exam-prep');
    await page.waitForLoadState('networkidle');

    // Verify Header
    await expect(page.locator('h1')).toContainText('AI Exam Preparation');

    // 2. Open Modal to create subject collection
    const newSubjectBtn = page.getByRole('button', { name: /New Subject/i }).first();
    await newSubjectBtn.click();

    // Verify Modal
    await expect(page.getByText('New Subject Study Collection')).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="Database Management Systems"]', 'Database Management Systems');
    await page.fill('input[placeholder*="CS401"]', 'CS401');
    
    // Submit using exact modal button text
    const submitBtn = page.getByRole('button', { name: /Create & Upload PDFs/i });
    await submitBtn.click();

    // Verify collection created and displayed
    await expect(page.getByText('Database Management Systems').first()).toBeVisible({ timeout: 15000 });

    // 3. Tab Navigation Without Screen Jitter/Loader Flashing
    const tabs = ['Important Questions', '2 Marks', '4 Marks', '10 Marks', 'Revision Mode', 'Ask AI', 'My Subjects'];
    for (const tabName of tabs) {
      const tabButton = page.getByRole('button', { name: new RegExp(tabName, 'i') }).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(150);
      }
    }

    // 4. Persistence on Reload: Reload page and verify created subject is still displayed for this student
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Database Management Systems').first()).toBeVisible({ timeout: 15000 });
  });

  test('Feature 2: RepoDNA - Analyze GitHub Repository & Interactive Features', async ({ page }) => {
    // 1. Visit RepoDNA Page
    await page.goto('http://127.0.0.1:5173/student/repodna');
    await page.waitForLoadState('networkidle');

    // Verify Header
    await expect(page.locator('h1')).toContainText('Understand Any GitHub Project');

    // 2. Enter GitHub URL
    const repoInput = page.locator('input[placeholder*="github.com"]');
    await repoInput.fill('https://github.com/pallets/flask');

    // Click Analyze
    const analyzeBtn = page.getByRole('button', { name: /Analyze Repository/i });
    await analyzeBtn.click();

    // 3. Wait for Analysis or Progress to complete
    await expect(page.getByRole('button', { name: /Overview/i }).first()).toBeVisible({ timeout: 30000 });

    // 4. Test Tab Navigation across intelligence tabs
    const tabs = ['Architecture', 'Project Structure', 'Tech Stack', 'Database', 'APIs', 'Health & Suggestions', 'Interview Prep', 'Ask RepoDNA'];
    for (const tabName of tabs) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tabName, 'i') }).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(150);
      }
    }

    // 5. Ask RepoDNA Chat
    const chatTab = page.getByRole('button', { name: /Ask RepoDNA/i }).first();
    if (await chatTab.isVisible()) {
      await chatTab.click();
      const chatInput = page.locator('input[placeholder*="Ask anything"]');
      if (await chatInput.isVisible()) {
        await chatInput.fill('Where is the application entry point?');
        await page.getByRole('button', { name: /Send/i }).click();
        await page.waitForTimeout(1000);
      }
    }

    // 6. Persistence on Reload: Reload page and verify repo header remains
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Understand Any GitHub Project');
  });

});
