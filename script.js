// 1. إعدادات Supabase (تأكد من وجود علامات التنصيص)
const SUPABASE_URL ='https://pfcbjxugkulvzvioxogt.supabase.co';
const SUPABASE_KEY ='sb_publishable_2KCCx-Agm4GGw_tPGrlTVQ_Ye7bp4Qn';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class MusicPro {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.currentSong = null;
        this.isPlaying = false;
        this.albums = []; // مصفوفة لتخزين البيانات القادمة من السيرفر
        this.previousVolume = 0.7;
        
        this.init();
    }

    async init() {
        // جلب البيانات من سوبابيز
        const { data, error } = await _supabase.from('albums').select('*');
        
        if (error) {
            console.error("Connection Error:", error);
            this.albums = this.getDefaultFallback(); 
        } else {
            this.albums = data;
        }

        this.renderAlbums(this.albums, 'albumsGrid');
        this.bindEvents();
        if (this.audio) this.audio.volume = this.previousVolume;
    }

    renderAlbums(albumsToRender, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!albumsToRender || albumsToRender.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-compact-disc fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No cinematic collections found in your library.</p>
                </div>`;
            return;
        }

        container.innerHTML = albumsToRender.map(album => `
            <div class="album-card" onclick="app.playAlbum('${album.id}')">
                <div class="image-container">
                    <img src="${album.cover_url}" 
                         alt="${album.title}" 
                         class="album-cover" 
                         onerror="this.src='https://via.placeholder.com/300x300/121212/ffffff?text=No+Cover'">
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="album-info">
                    <strong class="album-name">${album.title}</strong>
                    <span class="artist-name">${album.artist || 'Unknown Artist'}</span>
                </div>
            </div>
        `).join('');
    }

    async playAlbum(albumId) {
        const album = this.albums.find(a => a.id == albumId);
        if (!album) return;

        console.log(`Now Playing: ${album.title}`);

        // تحديث واجهة المشغل
        const titleEl = document.getElementById('trackTitle');
        const artistEl = document.getElementById('trackArtist');
        const coverEl = document.getElementById('playerCover');

        if (titleEl) titleEl.textContent = album.title;
        if (artistEl) artistEl.textContent = album.artist || 'Unknown Artist';
        if (coverEl) coverEl.src = album.cover_url;

        // منطق تشغيل أول أغنية (إذا كنت قد أضفت عمود الأغاني)
        if (album.songs && album.songs.length > 0) {
            this.playSong(album.songs[0]);
        }
    }

    playSong(song) {
        if (!song || !song.url) return;
        this.currentSong = song;
        this.audio.src = song.url;
        this.audio.play();
        this.updatePlayerUI();
    }

    updatePlayerUI() {
        const btn = document.getElementById('playPauseBtn');
        if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    bindEvents() {
        const playBtn = document.getElementById('playPauseBtn');
        if (!playBtn) return;

        playBtn.onclick = () => {
            if (this.audio.paused) {
                this.audio.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                this.audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        };

        this.audio.ontimeupdate = () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            const progressEl = document.getElementById('progress');
            if (progressEl) progressEl.style.width = `${progress}%`;
            
            const currentEl = document.getElementById('currentTime');
            if (currentEl) currentEl.textContent = this.formatTime(this.audio.currentTime);
        };
    }

    formatTime(sec) {
        if (isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    getDefaultFallback() {
        return [
            { id: 1, title: "Cinematic Ambient", cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400", artist: "Studio Prime" }
        ];
    }
}

// إنشاء النسخة العالمية
const app = new MusicPro();
