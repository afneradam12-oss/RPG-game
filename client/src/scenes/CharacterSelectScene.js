import Phaser from 'phaser';
import { API_URL } from '../config.js';

/**
 * CharacterSelectScene — Sélection / Création de personnage
 */
export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data) {
    this.token = data.token;
    this.user = data.user;
    this.characters = data.characters || [];
  }

  create() {
    const { width, height } = this.cameras.main;

    // Fond
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x12122e, 1);
    bg.fillRect(0, 0, width, height);

    // Titre
    this.add.text(width / 2, 50, '🛡️ Sélection du Personnage', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#e8d5b7',
      stroke: '#2d1b00',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, 90, `Bienvenue, ${this.user.username}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8888aa',
    }).setOrigin(0.5);

    // Afficher les personnages existants
    this.displayCharacters(width, height);

    // Formulaire de création
    this.createCharacterForm(width, height);

    // Message d'erreur/succès
    this.errorText = this.add.text(width / 2, height - 30, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ff6b6b',
    }).setOrigin(0.5);
  }

  displayCharacters(width, height) {
    if (this.characters.length === 0) {
      this.add.text(width / 2, 140, 'Aucun personnage — Créez-en un !', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#666688',
        fontStyle: 'italic',
      }).setOrigin(0.5);
      return;
    }

    const classColors = {
      assassin: '#e74c3c',
      mage: '#3498db',
      paladin: '#f39c12',
      ranger: '#2ecc71',
      necromancer: '#9b59b6',
    };

    this.characters.forEach((char, index) => {
      const y = 140 + index * 70;

      // Cadre du personnage
      const card = this.add.graphics();
      card.fillStyle(0x1a1a2e, 0.9);
      card.fillRoundedRect(width / 2 - 200, y - 15, 400, 55, 8);
      card.lineStyle(1, Phaser.Display.Color.HexStringToColor(classColors[char.className] || '#ffffff').color, 0.6);
      card.strokeRoundedRect(width / 2 - 200, y - 15, 400, 55, 8);

      // Nom et infos
      this.add.text(width / 2 - 180, y, `${char.name}`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: classColors[char.className] || '#ffffff',
        fontStyle: 'bold',
      });

      this.add.text(width / 2 - 180, y + 22, `${char.className.toUpperCase()} — Niv. ${char.level}`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#8888aa',
      });

      // Bouton jouer
      const playBtn = this.add.text(width / 2 + 120, y + 10, '▶ JOUER', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#6bff6b',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      playBtn.on('pointerdown', () => {
        this.startGame(char);
      });

      playBtn.on('pointerover', () => playBtn.setColor('#aaffaa'));
      playBtn.on('pointerout', () => playBtn.setColor('#6bff6b'));

      // Bouton supprimer
      const deleteBtn = this.add.text(width / 2 + 185, y + 10, '🗑️', {
        fontFamily: 'Arial',
        fontSize: '14px',
        backgroundColor: 'rgba(255,0,0,0.2)',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      deleteBtn.on('pointerdown', () => {
        if (window.confirm(`Voulez-vous vraiment supprimer ${char.name} ?`)) {
          this.handleDeleteCharacter(char._id);
        }
      });
      deleteBtn.on('pointerover', () => deleteBtn.setBackgroundColor('rgba(255,0,0,0.5)'));
      deleteBtn.on('pointerout', () => deleteBtn.setBackgroundColor('rgba(255,0,0,0.2)'));
    });
  }

  createCharacterForm(width, height) {
    const formY = Math.max(350, 160 + this.characters.length * 70);

    this.add.text(width / 2, formY, '✨ Créer un nouveau personnage', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#e8d5b7',
    }).setOrigin(0.5);

    const formHTML = `
      <div style="
        width: 400px;
        padding: 24px;
        background: rgba(20, 20, 40, 0.95);
        border: 1px solid rgba(108, 92, 231, 0.3);
        border-radius: 10px;
        font-family: Arial, sans-serif;
      ">
        <div style="margin-bottom: 10px;">
          <input type="text" id="char-name" placeholder="Nom du personnage" maxlength="16" style="
            width: 100%; padding: 8px 12px;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
            color: #e0e0ff; font-size: 14px; outline: none; box-sizing: border-box;
          " />
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <select id="char-sex" style="
            flex: 1; padding: 8px 12px;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
            color: #e0e0ff; font-size: 14px; outline: none;
          ">
            <option value="male" style="background: #1a1a2e;">Homme</option>
            <option value="female" style="background: #1a1a2e;">Femme</option>
          </select>

          <select id="char-class" style="
            flex: 1; padding: 8px 12px;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
            color: #e0e0ff; font-size: 14px; outline: none;
          ">
            <option value="assassin" style="background: #1a1a2e;">🗡️ Assassin</option>
            <option value="mage" style="background: #1a1a2e;">🔮 Mage</option>
            <option value="paladin" style="background: #1a1a2e;">🛡️ Paladin</option>
            <option value="ranger" style="background: #1a1a2e;">🏹 Ranger</option>
            <option value="necromancer" style="background: #1a1a2e;">💀 Nécromancien</option>
          </select>
        </div>

        <div id="class-stats" style="
          margin-bottom: 12px; padding: 10px;
          background: rgba(0,0,0,0.3); border-radius: 6px;
          font-size: 12px; color: #8888aa;
        ">
          Sélectionnez une classe pour voir les stats
        </div>

        <button id="create-btn" style="
          width: 100%; padding: 10px;
          background: linear-gradient(135deg, #6c5ce7, #a855f7);
          border: none; border-radius: 6px;
          color: white; font-size: 14px; font-weight: bold;
          cursor: pointer; letter-spacing: 1px;
        ">
          CRÉER LE PERSONNAGE
        </button>
      </div>
    `;

    this.formElement = this.add.dom(width / 2, formY + 130).createFromHTML(formHTML);

    // Afficher les stats de la classe sélectionnée
    const classSelect = this.formElement.getChildByID('char-class');
    const statsDiv = this.formElement.getChildByID('class-stats');

    const classStats = {
      assassin:    '❤️ 80 HP  |  💧 40 Mana  |  ⚔️ 14 FOR  |  🏃 16 DEX  |  🧠 8 INT  |  💪 8 VIT',
      mage:        '❤️ 70 HP  |  💧 100 Mana  |  ⚔️ 6 FOR  |  🏃 8 DEX  |  🧠 18 INT  |  💪 6 VIT',
      paladin:     '❤️ 120 HP  |  💧 40 Mana  |  ⚔️ 14 FOR  |  🏃 6 DEX  |  🧠 10 INT  |  💪 16 VIT',
      ranger:      '❤️ 90 HP  |  💧 50 Mana  |  ⚔️ 10 FOR  |  🏃 16 DEX  |  🧠 10 INT  |  💪 10 VIT',
      necromancer: '❤️ 75 HP  |  💧 90 Mana  |  ⚔️ 8 FOR  |  🏃 8 DEX  |  🧠 16 INT  |  💪 8 VIT',
    };

    // Afficher les stats initiales
    statsDiv.innerHTML = classStats[classSelect.value];

    classSelect.addEventListener('change', () => {
      statsDiv.innerHTML = classStats[classSelect.value] || '';
    });

    // Création du personnage
    const createBtn = this.formElement.getChildByID('create-btn');
    createBtn.addEventListener('click', () => this.handleCreateCharacter());
  }

  async handleCreateCharacter() {
    const name = this.formElement.getChildByID('char-name').value.trim();
    const sex = this.formElement.getChildByID('char-sex').value;
    const className = this.formElement.getChildByID('char-class').value;

    if (!name) {
      this.showError('Veuillez entrer un nom de personnage');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ name, sex, className }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.showError(data.error || 'Erreur lors de la création');
        return;
      }

      // Rafraîchir la scène avec le nouveau personnage
      this.characters.push(data.character);
      this.scene.restart({
        token: this.token,
        user: this.user,
        characters: this.characters,
      });

    } catch (error) {
      console.error('Erreur création personnage:', error);
      this.showError('Impossible de contacter le serveur');
    }
  }

  startGame(character) {
    localStorage.setItem('rpg_character', JSON.stringify(character));
    this.scene.start('GameScene', {
      token: this.token,
      user: this.user,
      character,
    });
  }

  async handleDeleteCharacter(characterId) {
    try {
      const response = await fetch(`${API_URL}/characters/${characterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        this.showError(data.error || 'Erreur lors de la suppression');
        return;
      }

      // Mettre à jour la liste locale et redémarrer la scène
      this.characters = this.characters.filter(c => c._id !== characterId);
      this.scene.restart({
        token: this.token,
        user: this.user,
        characters: this.characters,
      });

    } catch (error) {
      console.error('Erreur suppression personnage:', error);
      this.showError('Impossible de contacter le serveur');
    }
  }

  showError(msg) {
    this.errorText.setText(msg);
    this.time.delayedCall(4000, () => this.errorText.setText(''));
  }
}
