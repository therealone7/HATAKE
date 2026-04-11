class MusicApp {
    constructor() {
        // Elements
        this.audio = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.progressBars = document.querySelectorAll('.progress'); // Desktop and Mobile
        this.progressContainers = [document.getElementById('progressBar'), document.getElementById('mobileProgressBar')];
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.muteBtn = document.getElementById('muteBtn');
        
        // State
        this.currentAlbum = null;
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.previousVolume = 0.7;
        this.currentUser = localStorage.getItem('username') || null;
        this.albums = JSON.parse(localStorage.getItem('customAlbums')) || this.getDefaultAlbums();
        
        this.init();
    }
    
    init() {
        this.updateAuthUI();
        this.renderAlbums(this.albums, 'albumsGrid');
        this.bindEvents();
        this.audio.volume = this.previousVolume;
        this.restorePlayerState();
    }

    // --- Toast Notifications ---
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Data & Rendering ---
    getDefaultAlbums() {
        return [
            {
                id: 1, title: "Lofi Study", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80",
                songs: [
                    { id: 101, title: "Chill Beats", artist: "Creator", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                    { id: 102, title: "Night Walk", artist: "Creator", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
                ]
            },
            {
                id: 2, title: "Epic Cinematic", cover: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&q=80",
                songs: [
                    { id: 201, title: "The Journey", artist: "Composer", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
                ]
            }
        ];
    }
    
    renderAlbums(albumsToRender, containerId) {
        const container = document.getElementById(containerId);
        if(!albumsToRender.length) {
            container.innerHTML = '<p style="color:#b3b3b3;">No albums found.</p>';
            return;
        }
        container.innerHTML = albumsToRender.map(album => `
            <div class="album-card" data-album-id="${album.id}">
                <img src="${album.cover}" alt="${album.title}" class="album-cover" onerror="this.src='https://via.placeholder.com/400x400/282828/ffffff?text=?'">
                <div class="album-title">${album.title}</div>
                <div class="album-songs">${album.songs.length} songs</div>
            </div>
        `).join('');
    }

    // --- Search Functionality ---
    handleSearch(query) {
        if(!query) {
            this.renderAlbums(this.albums, 'searchResultsGrid');
            return;
        }
        const lowerQuery = query.toLowerCase();
        const results = this.albums.filter(album => 
            album.title.toLowerCase().includes(lowerQuery) || 
            album.songs.some(song => song.title.toLowerCase().includes(lowerQuery) || song.artist.toLowerCase().includes(lowerQuery))
        );
        this.renderAlbums(results, 'searchResultsGrid');
    }

    // --- Core Player Logic & Persistence ---
    playSong(album, songIndex, startPaused = false) {
        this.currentAlbum = album;
        this.currentSongIndex = songIndex;
        const song = album.songs[songIndex];
        
        if (this.audio.src !== song.src) {
            this.audio.src = song.src;
        }

        // Update UI
        document.getElementById('playerCover').src = album.cover;
        document.getElementById('trackTitle').textContent = song.title;
        document.getElementById('trackArtist').textContent = song.artist;

        // Media Session API (Background play info)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: album.title,
                artwork: [{ src: album.cover, sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prevSong());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSong());
        }

        if (!startPaused) {
            this.audio.play().catch(e => this.showToast("Error playing audio format/URL.", "error"));
        }
        
        this.savePlayerState();
    }

    savePlayerState() {
        if(!this.currentAlbum) return;
        const state = {
            albumId: this.currentAlbum.id,
            songIndex: this.currentSongIndex,
            currentTime: this.audio.currentTime
        };
        localStorage.setItem('playerState', JSON.stringify(state));
    }

    restorePlayerState() {
        const saved = JSON.parse(localStorage.getItem('playerState'));
        if (saved && saved.albumId) {
            const album = this.albums.find(a => a.id === saved.albumId);
            if (album && album.songs[saved.songIndex]) {
                this.playSong(album, saved.songIndex, true); // start paused
                // wait for metadata to seek
                this.audio.addEventListener('loadedmetadata', () => {
                    if (saved.currentTime < this.audio.duration) {
                        this.audio.currentTime = saved.currentTime;
                    }
                }, { once: true });
            }
        }
    }

    togglePlayPause() {
        if (!this.audio.src || this.audio.src.includes(window.location.href)) {
             this.showToast("Please select a song first.", "error");
             return;
        }
        if (this.isPlaying) this.audio.pause();
        else this.audio.play();
    }

    nextSong() {
        if (!this.currentAlbum) return;
        let newIndex = (this.currentSongIndex + 1) % this.currentAlbum.songs.length;
        this.playSong(this.currentAlbum, newIndex);
    }

    prevSong() {
        if (!this.currentAlbum) return;
        let newIndex = this.currentSongIndex - 1;
        if (newIndex < 0) newIndex = this.currentAlbum.songs.length - 1;
        this.playSong(this.currentAlbum, newIndex);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.muteBtn.innerHTML = this.isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        this.volumeSlider.value = this.isMuted ? 0 : (this.previousVolume * 100);
    }

    // --- Events & Navigation ---
    bindEvents() {
        // Navigation (Desktop & Mobile)
        const showSection = (sectionId) => {
            document.getElementById('homeSection').style.display = sectionId === 'home' ? 'block' : 'none';
            document.getElementById('searchSection').style.display = sectionId === 'search' ? 'block' : 'none';
            if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
        };

        document.getElementById('homeBtn').onclick = () => showSection('home');
        document.getElementById('bottomHomeBtn').onclick = () => showSection('home');
        
        document.getElementById('searchBtn').onclick = () => showSection('search');
        document.getElementById('bottomSearchBtn').onclick = () => { showSection('search'); document.getElementById('searchInput').focus(); };

        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Mobile Menu Toggle
        document.getElementById('mobileMenuBtn').onclick = () => {
            document.getElementById('sidebar').classList.toggle('active');
        };

        // Album Click Delegation
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.album-card');
            if (card) {
                const albumId = parseInt(card.dataset.albumId);
                this.showAlbumSongs(albumId);
            }
            if (e.target.closest('.close-modal')) {
                e.target.closest('.modal').classList.remove('active');
            }
        });

        // Player Controls
        this.playPauseBtn.onclick = () => this.togglePlayPause();
        document.getElementById('nextBtn').onclick = () => this.nextSong();
        document.getElementById('prevBtn').onclick = () => this.prevSong();
        this.muteBtn.onclick = () => this.toggleMute();

        // Volume
        this.volumeSlider.oninput = (e) => {
            this.audio.volume = e.target.value / 100;
            this.previousVolume = this.audio.volume;
            if(this.audio.volume > 0 && this.isMuted) this.toggleMute();
        };

        // Progress Bars (Click to seek)
        this.progressContainers.forEach(container => {
            if(!container) return;
            container.onclick = (e) => {
                const rect = container.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if(this.audio.duration) this.audio.currentTime = percent * this.audio.duration;
            };
        });

        // Audio Listeners
        this.audio.onplay = () => {
            this.isPlaying = true;
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause" style="color:#000;"></i>';
        };
        this.audio.onpause = () => {
            this.isPlaying = false;
            this.playPauseBtn.innerHTML = '<i class="fas fa-play" style="color:#000;"></i>';
            this.savePlayerState(); // Save state when paused
        };
        this.audio.onended = () => this.nextSong();
        this.audio.ontimeupdate = () => {
            if(this.audio.duration) {
                const percent = (this.audio.currentTime / this.audio.duration) * 100;
                this.progressBars.forEach(bar => bar.style.width = `${percent}%`);
                this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
                // Periodically save state (every ~5 seconds) to avoid spamming localStorage
                if(Math.floor(this.audio.currentTime) % 5 === 0) this.savePlayerState();
            }
        };
        this.audio.onloadedmetadata = () => {
            this.durationEl.textContent = this.formatTime(this.audio.duration);
        };

        // Auth & Forms
        document.getElementById('loginBtn').onclick = () => {
            if (this.currentUser) {
                localStorage.removeItem('username');
                this.currentUser = null;
                this.updateAuthUI();
                this.showToast("Logged out successfully.");
            } else {
                document.getElementById('loginModal').classList.add('active');
            }
        };

        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            this.currentUser = document.getElementById('usernameInput').value;
            localStorage.setItem('username', this.currentUser);
            this.updateAuthUI();
            document.getElementById('loginModal').classList.remove('active');
            this.showToast(`Welcome, ${this.currentUser}!`);
            e.target.reset();
        };

        document.getElementById('openAddAlbumBtn').onclick = () => {
            if(!this.currentUser) {
                this.showToast("Please login first to create an album.", "error");
                document.getElementById('loginModal').classList.add('active');
                return;
            }
            document.getElementById('createAlbumModal').classList.add('active');
        };

        document.getElementById('createAlbumForm').onsubmit = (e) => {
            e.preventDefault();
            const newAlbum = {
                id: Date.now(),
                title: document.getElementById('albumTitle').value,
                cover: document.getElementById('albumCover').value,
                songs: [{
                    id: Date.now() + 1,
                    title: document.getElementById('songTitle').value,
                    artist: document.getElementById('songArtist').value,
                    src: document.getElementById('songUrl').value
                }]
            };
            this.albums.push(newAlbum);
            localStorage.setItem('customAlbums', JSON.stringify(this.albums));
            this.renderAlbums(this.albums, 'albumsGrid');
            document.getElementById('createAlbumModal').classList.remove('active');
            this.showToast("Album created successfully!");
            e.target.reset();
        };
    }

    // --- UI Helpers ---
    showAlbumSongs(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        if(!album) return;
        const modal = document.getElementById('songModal');
        const content = document.getElementById('songModalContent');
        
        content.innerHTML = `
            <div class="modal-header">
                <h3>${album.title}</h3>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="song-list">
                ${album.songs.map((song, idx) => `
                    <div class="song-item ${this.currentAlbum?.id === album.id && this.currentSongIndex === idx ? 'playing' : ''}" data-index="${idx}">
                        <span class="song-number">${idx + 1}</span>
                        <div class="track-info">
                            <div class="track-title">${song.title}</div>
                            <div class="track-artist">${song.artist}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        modal.classList.add('active');
        
        content.querySelectorAll('.song-item').forEach(item => {
            item.onclick = () => {
                this.playSong(album, parseInt(item.dataset.index));
                modal.classList.remove('active');
            };
        });
    }

    updateAuthUI() {
        const profileText = document.getElementById('profileText');
        const welcomeText = document.getElementById('welcomeText');
        if (this.currentUser) {
            profileText.textContent = `Logout (${this.currentUser})`;
            welcomeText.textContent = `Welcome back, ${this.currentUser}`;
        } else {
            profileText.textContent = 'Login';
            welcomeText.textContent = 'Welcome to Music Pro';
        }
    }

    formatTime(seconds) {
        if(isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', () => new MusicApp());
