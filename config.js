// config.js
const BOOK_MAP = {
  'genesis': 'GEN', 'gen': 'GEN',
  'exodus': 'EXO', 'exo': 'EXO',
  'leviticus': 'LEV', 'lev': 'LEV',
  'numbers': 'NUM', 'num': 'NUM',
  'deuteronomy': 'DEU', 'deut': 'DEU',
  'joshua': 'JOS', 'josh': 'JOS',
  'judges': 'JDG', 'judg': 'JDG',
  'ruth': 'RUT',
  '1samuel': '1SA', '1sam': '1SA',
  '2samuel': '2SA', '2sam': '2SA',
  '1kings': '1KI', '1kgs': '1KI',
  '2kings': '2KI', '2kgs': '2KI',
  '1chronicles': '1CH', '1chr': '1CH',
  '2chronicles': '2CH', '2chr': '2CH',
  'ezra': 'EZR',
  'nehemiah': 'NEH', 'neh': 'NEH',
  'esther': 'EST', 'est': 'EST',
  'job': 'JOB',
  'psalms': 'PSA', 'ps': 'PSA', 'psalm': 'PSA',
  'proverbs': 'PRO', 'prov': 'PRO',
  'ecclesiastes': 'ECC', 'eccl': 'ECC',
  'songofsolomon': 'SNG', 'song': 'SNG', 'sos': 'SNG',
  'isaiah': 'ISA', 'isa': 'ISA',
  'jeremiah': 'JER', 'jer': 'JER',
  'lamentations': 'LAM', 'lam': 'LAM',
  'ezekiel': 'EZK', 'ezek': 'EZK',
  'daniel': 'DAN', 'dan': 'DAN',
  'hosea': 'HOS', 'hos': 'HOS',
  'joel': 'JOL',
  'amos': 'AMO',
  'obadiah': 'OBA', 'obad': 'OBA',
  'jonah': 'JON',
  'micah': 'MIC',
  'nahum': 'NAM',
  'habakkuk': 'HAB',
  'zephaniah': 'ZEP', 'zeph': 'ZEP',
  'haggai': 'HAG',
  'zechariah': 'ZEC', 'zech': 'ZEC',
  'malachi': 'MAL', 'mal': 'MAL',
  'matthew': 'MAT', 'matt': 'MAT',
  'mark': 'MRK', 'mk': 'MRK',
  'luke': 'LUK', 'lk': 'LUK',
  'john': 'JHN', 'jn': 'JHN',
  'acts': 'ACT',
  'romans': 'ROM', 'rom': 'ROM',
  '1corinthians': '1CO', '1cor': '1CO',
  '2corinthians': '2CO', '2cor': '2CO',
  'galatians': 'GAL', 'gal': 'GAL',
  'ephesians': 'EPH', 'eph': 'EPH',
  'philippians': 'PHP', 'phil': 'PHP',
  'colossians': 'COL', 'col': 'COL',
  '1thessalonians': '1TH', '1thess': '1TH',
  '2thessalonians': '2TH', '2thess': '2TH',
  '1timothy': '1TI', '1tim': '1TI',
  '2timothy': '2TI', '2tim': '2TI',
  'titus': 'TIT',
  'philemon': 'PHM', 'philem': 'PHM',
  'hebrews': 'HEB', 'heb': 'HEB',
  'james': 'JAS', 'jas': 'JAS',
  '1peter': '1PE', '1pet': '1PE',
  '2peter': '2PE', '2pet': '2PE',
  '1john': '1JN', '1jn': '1JN',
  '2john': '2JN', '2jn': '2JN',
  '3john': '3JN', '3jn': '3JN',
  'jude': 'JUD',
  'revelation': 'REV', 'rev': 'REV'
};

const BIBLE_ID = 'de4e12af7f28f599-01'; // Default: KJV

if (typeof BOOK_MAP === 'undefined' || typeof BIBLE_ID === 'undefined') {
  console.error('Configuration missing in config.js');
}

module.exports = { BOOK_MAP, BIBLE_ID };