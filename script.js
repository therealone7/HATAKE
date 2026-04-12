// إعدادات Supabase - ضع روابط مشروعك هنا
const SUPABASE_URL = https://pfcbjxugkulvzvioxogt.supabase.co;
const SUPABASE_KEY = sb_publishable_2KCCx-Agm4GGw_tPGrlTVQ_Ye7bp4Qn;
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class MusicPro {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.currentSong = null;
        this.isPlaying = false;
        
        this.init();
    }

    async init() {
    this.updateAuthUI();
    
    // جلب البيانات من سوبابيز بدلاً من getDefaultAlbums
    const { data, error } = await _supabase.from('albums').select('*');
    
    if (error) {
        console.error("Error:", error);
        this.albums = this.getDefaultAlbums(); // كخطة بديلة في حال فشل الاتصال
    } else {
        this.albums = data;
    }

    this.renderAlbums(this.albums, 'albumsGrid');
    this.bindEvents();
    this.audio.volume = this.previousVolume;
    this.restorePlayerState();
}

    // جلب البيانات من Supabase بدلاً من LocalStorage
    async loadAlbums() {
        try {
            // ملاحظة: افترضنا وجود جدول باسم 'albums'
            const { data, error } = await supabase.from('albums').select('*');
            
            if (error) throw error;
            this.renderAlbums(data || this.getDefaultFallback(), 'albumsGrid');
        } catch (err) {
            console.warn("Using fallback data...");
            this.renderAlbums(this.getDefaultFallback(), 'albumsGrid');
        }
    }

    renderAlbums(albums, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = albums.map(album => `
            <div class="album-card" onclick="app.playAlbum(${album.id})">
                <img src="${album.cover_url}" alt="${album.title}">
                <div class="album-info">
                    <strong>${album.title}</strong>
                    <p>${album.artist || 'فنان مجهول'}</p>
                </div>
            </div>
        `).join('');
    }

    playSong(song) {
        this.currentSong = song;
        this.audio.src = song.url;
        this.audio.play();
        this.updateUI();
    }

    updateUI() {
        document.getElementById('trackTitle').textContent = this.currentSong.title;
        document.getElementById('trackArtist').textContent = this.currentSong.artist;
        document.getElementById('playerCover').src = this.currentSong.cover;
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
    }

    bindEvents() {
        const playBtn = document.getElementById('playPauseBtn');
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
            document.getElementById('progress').style.width = `${progress}%`;
            document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
        };

        this.audio.onloadedmetadata = () => {
            document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
        };
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    getDefaultFallback() {
        return [
            { id: 1, title: "موسيقى هادئة", cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400", artist: "Relax" },
            { id: 2, title: "إيقاع مغربي", cover_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400", artist: "Morocco" }
        ];
    }
}

const app = new MusicPro();
