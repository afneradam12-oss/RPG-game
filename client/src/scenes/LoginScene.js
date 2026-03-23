import Phaser from 'phaser';
import socketManager from '../network/SocketManager.js';
import { API_URL } from '../config.js';

/**
 * LoginScene — Écran de connexion / inscription
 * Interface HTML overlay sur le canvas Phaser
 */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
    this.isRegistering = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // ── Fond animé ──
    this.createBackground(width, height);

    // ── Titre du jeu ──
    this.add.text(width / 2, 100, '⚔️ Realm of Shadows', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#e8d5b7',
      stroke: '#2d1b00',
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, 155, 'Action-RPG Coopératif', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#a89070',
    }).setOrigin(0.5);

    // ── Formulaire HTML overlay ──
    this.createFormOverlay(width, height);

    // ── Message d'erreur ──
    this.errorText = this.add.text(width / 2, height - 60, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ff6b6b',
      align: 'center',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, height - 35, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6bff6b',
      align: 'center',
    }).setOrigin(0.5);
  }

  createBackground(width, height) {
    // Dégradé sombre
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e, 1);
    bg.fillRect(0, 0, width, height);

    // Particules (étoiles)
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.7));
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: Phaser.Math.FloatBetween(0.1, 0.3) },
        duration: Phaser.Math.Between(1500, 4000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createFormOverlay(width, height) {
    const formHTML = `
      <div id="auth-form" style="
        width: 340px;
        padding: 30px;
        background: rgba(20, 20, 40, 0.95);
        border: 1px solid rgba(108, 92, 231, 0.4);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(108, 92, 231, 0.15);
        font-family: Arial, sans-serif;
      ">
        <h2 id="form-title" style="
          color: #e0e0ff;
          text-align: center;
          margin-bottom: 20px;
          font-size: 20px;
          letter-spacing: 1px;
        ">Connexion</h2>

        <div id="username-field" style="margin-bottom: 12px; display: none;">
          <input type="text" id="username" placeholder="Nom d'utilisateur" style="
            width: 100%;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            color: #e0e0ff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
            box-sizing: border-box;
          " onfocus="this.style.borderColor='rgba(108,92,231,0.7)'" onblur="this.style.borderColor='rgba(255,255,255,0.15)'" />
        </div>

        <div style="margin-bottom: 12px;">
          <input type="email" id="email" placeholder="Email" style="
            width: 100%;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            color: #e0e0ff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
            box-sizing: border-box;
          " onfocus="this.style.borderColor='rgba(108,92,231,0.7)'" onblur="this.style.borderColor='rgba(255,255,255,0.15)'" />
        </div>

        <div style="margin-bottom: 20px;">
          <input type="password" id="password" placeholder="Mot de passe" style="
            width: 100%;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            color: #e0e0ff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
            box-sizing: border-box;
          " onfocus="this.style.borderColor='rgba(108,92,231,0.7)'" onblur="this.style.borderColor='rgba(255,255,255,0.15)'" />
        </div>

        <button id="submit-btn" style="
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #6c5ce7, #a855f7);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          letter-spacing: 1px;
          transition: opacity 0.3s, transform 0.15s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          SE CONNECTER
        </button>

        <p id="toggle-text" style="
          text-align: center;
          margin-top: 15px;
          color: #8888aa;
          font-size: 13px;
          cursor: pointer;
        ">
          Pas de compte ? <span style="color: #a855f7; text-decoration: underline;">S'inscrire</span>
        </p>
      </div>
    `;

    this.formElement = this.add.dom(width / 2, height / 2 + 30).createFromHTML(formHTML);

    // ── Événements ──
    const submitBtn = this.formElement.getChildByID('submit-btn');
    const toggleText = this.formElement.getChildByID('toggle-text');

    submitBtn.addEventListener('click', () => this.handleSubmit());
    toggleText.addEventListener('click', () => this.toggleMode());

    // Soumission par Enter
    this.formElement.getChildByID('password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSubmit();
    });
  }

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    const title = this.formElement.getChildByID('form-title');
    const usernameField = this.formElement.getChildByID('username-field');
    const submitBtn = this.formElement.getChildByID('submit-btn');
    const toggleText = this.formElement.getChildByID('toggle-text');

    if (this.isRegistering) {
      title.textContent = 'Inscription';
      usernameField.style.display = 'block';
      submitBtn.textContent = "S'INSCRIRE";
      toggleText.innerHTML = 'Déjà un compte ? <span style="color: #a855f7; text-decoration: underline;">Se connecter</span>';
    } else {
      title.textContent = 'Connexion';
      usernameField.style.display = 'none';
      submitBtn.textContent = 'SE CONNECTER';
      toggleText.innerHTML = 'Pas de compte ? <span style="color: #a855f7; text-decoration: underline;">S\'inscrire</span>';
    }

    this.errorText.setText('');
    this.statusText.setText('');
  }

  async handleSubmit() {
    const email = this.formElement.getChildByID('email').value.trim();
    const password = this.formElement.getChildByID('password').value;

    if (!email || !password) {
      this.showError('Veuillez remplir tous les champs');
      return;
    }

    try {
      let endpoint, body;

      if (this.isRegistering) {
        const username = this.formElement.getChildByID('username').value.trim();
        if (!username) {
          this.showError("Veuillez entrer un nom d'utilisateur");
          return;
        }
        endpoint = `${API_URL}/register`;
        body = { username, email, password };
      } else {
        endpoint = `${API_URL}/login`;
        body = { email, password };
      }

      this.statusText.setText('Connexion en cours...');
      this.errorText.setText('');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        this.showError(data.error || 'Erreur inconnue');
        return;
      }

      // Sauvegarder le token
      localStorage.setItem('rpg_token', data.token);
      localStorage.setItem('rpg_user', JSON.stringify(data.user));

      this.statusText.setText('✅ ' + data.message);

      // Connexion Socket.io
      try {
        await socketManager.connect(data.token);
      } catch (socketError) {
        console.warn('Socket non connecté (serveur de jeu indisponible):', socketError.message);
      }

      // Passer à la sélection de personnage
      this.time.delayedCall(800, () => {
        this.scene.start('CharacterSelectScene', {
          token: data.token,
          user: data.user,
          characters: data.characters || [],
        });
      });

    } catch (error) {
      console.error('Erreur réseau:', error);
      this.showError('Impossible de contacter le serveur');
    }
  }

  showError(msg) {
    this.errorText.setText(msg);
    this.statusText.setText('');
  }
}
