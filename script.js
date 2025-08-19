// ... (Constantes, PageManager, AuthManager, StudentManager, ReportManager, StudentAuth inchangés) ...

class AdminManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('referentPasswordForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const newPassword = document.getElementById('newReferentPassword').value;
            this.changeReferentPassword(newPassword);
        });

        document.getElementById('logoUploadInput')?.addEventListener('change', e => {
            this.handleLogoUpload(e.target.files[0]);
        });

        document.getElementById('appResetBtn')?.addEventListener('click', () => this.fullResetApp());
    }

    changeReferentPassword(newPassword) {
        if (!newPassword || newPassword.length < 8) {
            return alert("Le mot de passe du Référant doit contenir au moins 8 caractères.");
        }
        const newHash = CryptoJS.SHA256(newPassword).toString();
        authManager.saveReferentPassword(newHash);
        alert("Le mot de passe du Référant Phare a été mis à jour avec succès.");
        document.getElementById('newReferentPassword').value = '';
    }

    handleLogoUpload(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                localStorage.setItem('collegeLogo', e.target.result);
                alert("Logo mis à jour. Il sera visible au prochain rechargement de la page d'accueil.");
            };
            reader.readAsDataURL(file);
        } else {
            alert("Veuillez sélectionner un fichier image valide.");
        }
    }

    checkResetButton() {
        const resetButton = document.getElementById('appResetBtn');
        if (!resetButton) return;

        if (localStorage.getItem('backup_done') === 'true') {
            resetButton.disabled = false;
            resetButton.classList.remove('disabled:bg-red-300', 'disabled:cursor-not-allowed');
        } else {
            resetButton.disabled = true;
            resetButton.classList.add('disabled:bg-red-300', 'disabled:cursor-not-allowed');
        }
    }

    fullResetApp() {
        if (confirm("ACTION IRRÉVERSIBLE !\n\nÊtes-vous absolument certain de vouloir réinitialiser toute l'application ? Toutes les données (élèves, signalements, mots de passe) seront effacées.")) {
            localStorage.removeItem('students_encrypted');
            localStorage.removeItem('reports_encrypted');
            localStorage.removeItem('email_config_encrypted');
            localStorage.removeItem('referent_password_encrypted');
            localStorage.removeItem('collegeLogo');
            localStorage.removeItem('backup_done');
            
            // Supprimer aussi les mots de passe locaux des élèves
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('student_')) {
                    localStorage.removeItem(key);
                }
            });

            alert("Application réinitialisée. La page va maintenant se recharger.");
            location.reload();
        }
    }
}


// =================================================================================
// Initialisation Finale
// =================================================================================

// ... (Définition des variables let inchangée)

document.addEventListener('DOMContentLoaded', () => {
    try {
        pageManager = new PageManager();
        authManager = new AuthManager();
        studentManager = new StudentManager();
        reportManager = new ReportManager();
        studentAuth = new StudentAuth();
        adminManager = new AdminManager();

        // Rendre les managers accessibles globalement
        window.pageManager = pageManager;
        window.authManager = authManager;
        window.studentManager = studentManager;
        window.reportManager = reportManager;
        window.studentAuth = studentAuth;
        window.adminManager = adminManager;

        // Surcharger la méthode de connexion pour déclencher les chargements de données
        const originalLogin = authManager.login.bind(authManager);
        authManager.login = (role, id = null) => {
            originalLogin(role, id);
            if (role === 'referent') {
                studentManager.loadStudents();
                reportManager.loadReports();
                reportManager.loadEmailConfig();
                pageManager.showPage('referentDashboardPage');
                studentManager.renderStudentTable();
                reportManager.renderReports();
                reportManager.renderEmailConfig();
            } else if (role === 'admin') {
                pageManager.showPage('adminDashboardPage');
                adminManager.checkResetButton();
            } else if (role === 'student') {
                pageManager.showPage('studentReportPage');
            }
        };
        
        pageManager.showPage('homePage');
        
    } catch (e) {
        console.error("Erreur critique lors de l'initialisation:", e);
        document.body.innerHTML = "Une erreur critique est survenue. Veuillez contacter le support.";
    }
});
u
