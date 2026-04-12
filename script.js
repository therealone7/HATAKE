// إعدادات Supabase - ضع روابط مشروعك هنا
const SUPABASE_URL = 'https://pfcbjxugkulvzvioxogt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2KCCx-Agm4GGw_tPGrlTVQ_Ye7bp4Qn';
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
    const { data, error } = await supabase.from('albums').select('*');
    
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

   renderAlbums(albumsToRender, containerId) {
    const container = document.getElementById(containerId);
    
    // 1. التحقق من وجود الحاوية لتجنب أخطاء Console
    if (!container) return;

    // 2. حالة عدم وجود بيانات
    if (!albumsToRender || albumsToRender.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-compact-disc fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No cinematic collections found in your library.</p>
            </div>`;
        return;
    }

    // 3. بناء الواجهة (English UI)
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
        // 1. البحث عن بيانات الألبوم في المصفوفة الحالية
        const album = this.albums.find(a => a.id == albumId);
        
        if (!album) return;

        console.log(`Playing Album: ${album.title}`);

        // 2. تحديث واجهة المشغل (Player) ببيانات الألبوم
        document.getElementById('trackTitle').textContent = album.title;
        document.getElementById('trackArtist').textContent = album.artist || 'Unknown Artist';
        document.getElementById('playerCover').src = album.cover_url;

        // 3. منطق تشغيل الأغنية الأولى (إذا كان لديك عمود للأغاني في سوبابيز)
        if (album.songs && album.songs.length > 0) {
            this.playSong(album.songs[0]);
        } else {
            // تنبيه بسيط في حال كان الألبوم فارغاً من الأغاني
            console.warn("This album has no songs yet.");
        }
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
