import { FileText, Image, Music, Video, Lock } from 'lucide-react';

const formatFileSize = (bytes , decimals = 2) => {

    if(bytes === 0) return '0 Bytes';

    if(typeof bytes !== 'number') return '0 bytes';

    if(bytes < 0) return '0 bytes';

    // Definig the units
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
   
    // To find the power of 1024 the bytes fall into
    const i = Math.floor(Math.log(bytes) / Math.log(k));


    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    
    
}

const formatFileDate = (dateString) => {

    if(!dateString) return 'Date is not available';

    let date;
    if(dateString instanceof Date){
        date = dateString;
    }else{
        date = new Date(dateString);
    }
    if(isNaN(date.getTime())) return 'Invalid date';

    // Extracting year , month  , day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Return Date formatted String : DD-MM-YYYY
    return `${day}-${month}-${year}`;
}

const getFileTypeLabel = (fileType) =>{

    if(!fileType) return 'Unknown';

    return fileType.charAt(0).toUpperCase() + fileType.slice(1)+'s';
}

const iconMap = {
    'document':FileText,
    'image':Image,
    'audio':Music,
    'video':Video,
    'private':Lock, 
}

const getFileIcon = (fileType) =>{

    if(!fileType) return FileText;

    const normalizedType = fileType.toLowerCase();

    return iconMap[normalizedType] || FileText;

}

const fileTypeColorMap = {
    document:'from-blue-500/80 to-cyan-500/80',
    image:'from-rose-500/80 to-pink-500/80',
    audio:'from-indigo-500/80 to-purple-500/80',
    video:'from-emerald-500/80 to-green-500/80',
    private:'from-sky-500/80 to-blue-500/80',
}

const getFileTypeColor = (fileType) =>{
    if(!fileType) return 'from-slate-600 to-slate-700';

    console.log(fileType);
    const normalizedType = fileType.toLowerCase();
    console.log(fileTypeColorMap[normalizedType]);

    return fileTypeColorMap[normalizedType] || 'from-slate-600 to-slate-700';
}
export { formatFileSize, formatFileDate , getFileTypeLabel , getFileIcon, getFileTypeColor};