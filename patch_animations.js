const fs = require('fs');
const path = './techversefrontend/src/pages/ProductDetailPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace animated.div with div
code = code.replace(/<animated\.div/g, '<div');
code = code.replace(/<\/animated\.div>/g, '</div>');

// Replace useSpring calls with empty objects
code = code.replace(/const fadeIn = useSpring\(\{[^}]*\}\);/g, 'const fadeIn = {};');
code = code.replace(/const slideLeft = useSpring\(\{[^}]*\}\);/g, 'const slideLeft = {};');
code = code.replace(/const slideRight = useSpring\(\{[^}]*\}\);/g, 'const slideRight = {};');
code = code.replace(/const cardsMount = useSpring\(\{[^}]*\}\);/g, 'const cardsMount = {};');

// Remove the import just in case
code = code.replace(/import \{ useSpring, animated, config \} from '@react-spring\/web';/g, '');

fs.writeFileSync(path, code);
console.log('Patched ProductDetailPage.tsx');
