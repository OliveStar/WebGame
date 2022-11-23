const canvas = document.querySelector('canvas')
canvas.width = innerWidth
canvas.height = innerHeight
const c = canvas.getContext('2d')
// 以下是获取一些动态交互的页面元素
const scoreEL = document.querySelector('#score') // 分数标签
const startGameBtn = document.querySelector('#startGameBtn') // 开始游戏按钮
const modelEl = document.querySelector('#modelEl') // 分数弹出框
const finalScoreEl = document.querySelector('#finalScoreEl') // 最终得分

// 玩家类
class Player{
  constructor(x,y,radius, color){
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  draw(){
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false)
    c.fillStyle = this.color
    c.fill()
  }
}

// 子弹类
class Projectile{
  constructor(x,y,radius,color,velocity){
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }
  
  draw(){
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false)
    c.fillStyle = this.color
    c.fill()
  }

  // 每帧更新，绘制子弹的位置
  update(){
    this.draw()
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }

}

// 运动粒子类
const friction = 0.97 // 模拟粒子匀减速运动
class Particle{
  constructor(x,y,radius,color,velocity){
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.alpha = 1 // 控制粒子透明度，用来实现淡出效果
  }
  
  draw(){
    c.save() // 粒子淡出，要改变全局画布透明度，要维护之前的状态
    c.globalAlpha = this.alpha
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false)
    c.fillStyle = this.color
    c.fill()
    c.restore()
  }

  // 每帧更新，绘制粒子的位置
  update(){
    this.draw()
    this.velocity.x *= friction
    this.velocity.y *= friction
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01 // 改变粒子透明度，实现淡出
  }

}

// 敌人类
class Enemy{
  constructor(x,y,radius,color,velocity){
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }
  
  draw(){
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false)
    c.fillStyle = this.color
    c.fill()
  }

  // 每帧更新，绘制敌人的位置
  update(){
    this.draw()
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }

}

// 在屏幕中央绘制玩家
const x = canvas.width / 2
const y = canvas.height / 2
let player = new Player(x, y, 10, 'white')

// 游戏资源队列
let projectiles = []
let enemies = []
let particles = []

// 初始化游戏状态
function init(){
  player = new Player(x, y, 10, 'white')
  projectiles = []
  enemies = []
  particles = []
  score = 0
  scoreEL.innerHTML = score
  finalScoreEl.innerHTML = score
}

// 生成敌人
function spawnEnemies(){
  setInterval(() => {
    // 敌人随机在屏幕上下左右边缘生成
    // 随机生成敌人的大小，但不能比子弹小
    const radius = Math.random() * (30 - 4) + 4
    let x
    let y
    if(Math.random() < 0.5){
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
      y = Math.random() * canvas.height
    }else{
      x= Math.random() * canvas.width
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius  
    }
    
    // 随机生成敌人的颜色(hsl色值 0~360)
    const color = `hsl(${Math.random() * 360}, 50%, 50%)` 
    
    // 计算分量时，终点在前，起点在后
    const angle = Math.atan2(
      canvas.height/2 - y, 
      canvas.width/2 - x
    )
    const velocity = {
      x : Math.cos(angle),
      y : Math.sin(angle)
    }
    // 新生成的敌人加入资源队列
    enemies.push(new Enemy(x, y, radius, color, velocity))
  }, 1000)
}

// 每帧调用的动画方法
let animationId
let score = 0
function animate(){
  animationId = requestAnimationFrame(animate);
  c.fillStyle = 'rgba(0,0,0,0.1)' // 设置背景颜色，透明度0.1实现一点粒子拖尾效果
  c.fillRect(0, 0, canvas.width, canvas.height)
  player.draw()
  // 检查当前是否有未绘制的粒子效果
  particles.forEach((particle, index) => {
    // 粒子的透明度小于0时要移出队列，否则变为负数会重新显示
    if(particle.alpha <= 0){
      particles.splice(index, 1) // 移出index位置的1个粒子
    }else{
      particle.update() // 没有完全消失前都要重新更新绘制
    }
  });
  
  // 子弹运动动画
  projectiles.forEach(
    (projectile, projectileIndex)=>{
      projectile.update()
      // 子弹超出屏幕的上下左右侧时，从队列中清理该实例
      if(projectile.x + projectile.radius < 0 ||
         projectile.x - projectile.radius > canvas.width ||
         projectile.y + projectile.radius < 0 ||
         projectile.y - projectile.radius > canvas.height){
        setTimeout(() => {
          projectiles.splice(projectileIndex, 1)  // 移出index位置的1个子弹
        }, 0)
      }
    }
  );

  // 敌人运动动画
  enemies.forEach((enemy, index) => {
    enemy.update()
    // 计算玩家和敌人之间的距离
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
    
    // 敌人接触玩家,结束游戏
    if(dist - enemy.radius - player.radius < 1)
    {
      cancelAnimationFrame(animationId)
      // 结束游戏时展示对话框，更新最终得分
      modelEl.style.display='flex'
      finalScoreEl.innerHTML = score
    }
    // 子弹运动动画
    projectiles.forEach((projectile, projectileIndex) => {
      // 计算子弹和敌人之间的距离
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
      // 子弹击中敌人的处理：1）每次攻击使敌人变小；2）敌人小于一定尺寸时变成粒子碎片
      if(dist - enemy.radius - projectile.radius < 1)
      {
        // 生成向四面八方发射的粒子(方向、粒子个数和敌人大小有关)
        for(let i = 0; i < enemy.radius * 2; i++){
          particles.push(new Particle(projectile.x, 
          projectile.y, Math.random() * 2, enemy.color, 
          {x: (Math.random() - 0.5) * (Math.random() * 6), 
          y: (Math.random() - 0.5) * (Math.random() * 6)}))
        }
        if(enemy.radius - 10 > 5){
          score += 100 // 击中敌人得100分
          scoreEL.innerHTML = score
          // 调用gsap动画库，让敌人尺寸变化更平滑
          gsap.to(enemy, {
            radius: enemy.radius - 10
          })
          // 子弹击中后就要移出队列，否则不会缩小，会一直调用直到跳else敌人消失
          setTimeout(() => { // 用setTimeout减少子弹绘制时的flashing现象
            projectiles.splice(projectileIndex, 1)  
          }, 0)
        }else{
          score += 250 // 击败敌人得250分
          scoreEL.innerHTML = score
          // 敌人被击败，子弹和敌人都移出队列
          setTimeout(() => { // 用setTimeout减少子弹绘制时的flashing现象
            enemies.splice(index, 1)
            projectiles.splice(projectileIndex, 1)  
          }, 0)
        }
        
      }
    });
  })
}

// 监听并响应鼠标点击事件
window.addEventListener('click',(event)=>{
  // 计算点击位置和方向，发射子弹
  const angle = Math.atan2(
    event.clientY - canvas.height/2, 
    event.clientX - canvas.width/2
  )
  const velocity = {
    x : 4 * Math.cos(angle),
    y : 4 * Math.sin(angle)
  }

  // 将新生成的子弹加入资源队列
  projectiles.push(new Projectile(
      canvas.width / 2, 
      canvas.height / 2, 
      5, 
      'white', 
      velocity
  ))      

})

// 开始游戏操作
startGameBtn.addEventListener('click', ()=>{
  init()
  animate()
  spawnEnemies()
  modelEl.style.display='none' // 点击后隐藏对话框
})