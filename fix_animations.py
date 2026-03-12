import re

with open('techversefrontend/src/pages/ProductDetailPage.tsx', 'r') as f:
    content = f.read()

# Replace useSpring({...}) with {}
content = re.sub(r'const fadeIn = useSpring\(\{.*?\}\);', 'const fadeIn = {};', content, flags=re.DOTALL)
content = re.sub(r'const slideLeft = useSpring\(\{.*?\}\);', 'const slideLeft = {};', content, flags=re.DOTALL)
content = re.sub(r'const slideRight = useSpring\(\{.*?\}\);', 'const slideRight = {};', content, flags=re.DOTALL)
content = re.sub(r'const cardsMount = useSpring\(\{.*?\}\);', 'const cardsMount = {};', content, flags=re.DOTALL)

# Also remove animated.div wrappers to avoid styling/spring issues
content = content.replace('<animated.div style={fadeIn}>', '<div>')
content = content.replace('<animated.div style={slideLeft}>', '<div>')
content = content.replace('<animated.div style={slideRight}>', '<div>')
content = content.replace('<animated.div style={cardsMount}>', '<div>')
content = content.replace('</animated.div>', '</div>')

with open('techversefrontend/src/pages/ProductDetailPage.tsx', 'w') as f:
    f.write(content)

print("Fixed!")
