/**
 * game.js - 贪吃蛇游戏核心模块
 * 负责游戏逻辑、渲染和状态管理
 */

// SVG 路径数据
const SVG_PATHS = {
    // 卡通蛇头：圆形头部 + 椭圆眼睛 + 微笑
    snakeHead: 'M 10 2 C 5.58 2 2 5.58 2 10 C 2 14.42 5.58 18 10 18 C 14.42 18 18 14.42 18 10 C 18 5.58 14.42 2 10 2 Z M 7 8 C 7.55 8 8 8.45 8 9 C 8 9.55 7.55 10 7 10 C 6.45 10 6 9.55 6 9 C 6 8.45 6.45 8 7 8 Z M 13 8 C 13.55 8 14 8.45 14 9 C 14 9.55 13.55 10 13 10 C 12.45 10 12 9.55 12 9 C 12 8.45 12.45 8 13 8 Z M 10 15 C 8 15 6.5 14 6 13 L 14 13 C 13.5 14 12 15 10 15 Z',
    // 苹果：红苹果主体 + 绿叶 + 梗
    appleBody: 'M 10 18 C 14 18 17 15 17 11 C 17 7 14 4 10 4 C 6 4 3 7 3 11 C 3 15 6 18 10 18 Z',
    appleLeaf: 'M 11 4 C 11 1 14 1 15 2 C 15 5 12 5 11 4 Z',
    appleStem: 'M 10 4 L 10 2'
};

class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // 游戏配置
        this.gridSize = 20;  // 每格像素大小
        this.gridWidth = canvas.width / this.gridSize;   // 网格宽度
        this.gridHeight = canvas.height / this.gridSize; // 网格高度

        // 游戏状态
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.startTime = null;

        // 速度控制（毫秒/帧）
        this.speed = 150;
        this.minSpeed = 80;

        // 颜色配置
        this.colors = {
            snakeHead: '#06b6d4',      // 青色
            snakeBody: '#0891b2',      // 深青色
            snakeGlow: 'rgba(6, 182, 212, 0.5)',
            food: '#d946ef',           // 紫红色
            foodGlow: 'rgba(217, 70, 239, 0.6)',
            grid: 'rgba(255, 255, 255, 0.03)'
        };

        // 回调函数
        this.onScoreUpdate = null;
        this.onGameOver = null;

        // 初始化游戏
        this.init();
    }

    /**
     * 初始化游戏状态
     */
    init() {
        // 初始蛇身（3节）
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);

        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.speed = 150;

        // 生成食物
        this.generateFood();

        // 渲染初始画面
        this.render();
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning && !this.isPaused) return;

        if (this.isPaused) {
            // 继续游戏
            this.isPaused = false;
        } else {
            // 新游戏
            this.init();
            this.startTime = Date.now();
        }

        this.isRunning = true;
        this.loop();
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning) return;
        this.isPaused = true;
        if (this.gameLoop) {
            clearTimeout(this.gameLoop);
            this.gameLoop = null;
        }
    }

    /**
     * 继续游戏
     */
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.loop();
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.gameLoop) {
            clearTimeout(this.gameLoop);
            this.gameLoop = null;
        }
    }

    /**
     * 主游戏循环
     */
    loop() {
        if (!this.isRunning || this.isPaused) return;

        // 更新方向
        this.direction = this.nextDirection;

        // 移动蛇
        if (!this.move()) {
            // 游戏结束
            this.gameOver();
            return;
        }

        // 渲染
        this.render();

        // 继续循环
        this.gameLoop = setTimeout(() => this.loop(), this.speed);
    }

    /**
     * 移动蛇
     * @returns {boolean} 移动是否成功（false表示碰撞）
     */
    move() {
        const head = { ...this.snake[0] };

        // 根据方向移动头部
        switch (this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }

        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.gridWidth ||
            head.y < 0 || head.y >= this.gridHeight) {
            return false;
        }

        // 检查自身碰撞（排除尾部，因为移动时尾部会被移除）
        // 注意：如果头部将要到达食物位置，则需要检查整个蛇身（因为尾部不会被移除）
        const willEatFood = this.food && head.x === this.food.x && head.y === this.food.y;
        const checkLength = willEatFood ? this.snake.length : this.snake.length - 1;

        for (let i = 0; i < checkLength; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return false;
            }
        }

        // 将新头部加入蛇身
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 增加分数
            this.score += 10;

            // 通知分数更新
            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score);
            }

            // 加速（但不低于最小速度）
            if (this.speed > this.minSpeed) {
                this.speed -= 2;
            }

            // 生成新食物
            this.generateFood();
        } else {
            // 移除尾部
            this.snake.pop();
        }

        return true;
    }

    /**
     * 生成食物
     */
    generateFood() {
        let newFood;
        let isOnSnake;

        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };

            // 检查食物是否在蛇身上
            isOnSnake = this.snake.some(segment =>
                segment.x === newFood.x && segment.y === newFood.y
            );
        } while (isOnSnake);

        this.food = newFood;
    }

    /**
     * 设置移动方向
     * @param {string} newDirection - 新方向
     */
    setDirection(newDirection) {
        // 防止180度转向
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.stop();

        // 触发画布颤抖效果
        this.shakeCanvas();

        // 计算游戏时长
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        // 延迟显示游戏结束，让颤抖效果先播放
        setTimeout(() => {
            if (this.onGameOver) {
                this.onGameOver(this.score, duration);
            }
        }, 300);
    }

    /**
     * 画布颤抖效果
     */
    shakeCanvas() {
        const wrapper = this.canvas.parentElement;
        if (wrapper) {
            wrapper.classList.add('shake');
            setTimeout(() => {
                wrapper.classList.remove('shake');
            }, 500);
        }
    }

    /**
     * 渲染游戏画面
     */
    render() {
        const ctx = this.ctx;
        const size = this.gridSize;

        // 清空画布
        ctx.fillStyle = '#0f162a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * size, 0);
            ctx.lineTo(x * size, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * size);
            ctx.lineTo(this.canvas.width, y * size);
            ctx.stroke();
        }

        // 绘制食物（苹果 SVG）
        if (this.food) {
            const x = this.food.x * size;
            const y = this.food.y * size;
            
            ctx.save();
            ctx.translate(x, y);
            
            // 比例缩放 (原始路径基于 20x20)
            const scale = size / 20;
            ctx.scale(scale, scale);

            // 绘制苹果主体
            ctx.shadowColor = this.colors.foodGlow;
            ctx.shadowBlur = 15;
            ctx.fillStyle = this.colors.food;
            const body = new Path2D(SVG_PATHS.appleBody);
            ctx.fill(body);
            ctx.shadowBlur = 0;

            // 绘制梗
            ctx.strokeStyle = '#854d0e'; // 棕色
            ctx.lineWidth = 1.5;
            ctx.stroke(new Path2D(SVG_PATHS.appleStem));

            // 绘制叶子
            ctx.fillStyle = '#22c55e'; // 绿色
            ctx.fill(new Path2D(SVG_PATHS.appleLeaf));

            ctx.restore();
        }

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            const x = segment.x * size;
            const y = segment.y * size;
            const padding = 1;

            // 头部特殊处理（绘制卡通蛇头）
            if (index === 0) {
                ctx.save();
                ctx.translate(x + size / 2, y + size / 2);

                // 根据方向旋转蛇头
                let angle = 0;
                switch (this.direction) {
                    case 'right': angle = 0; break;
                    case 'down': angle = Math.PI / 2; break;
                    case 'left': angle = Math.PI; break;
                    case 'up': angle = -Math.PI / 2; break;
                }
                ctx.rotate(angle);

                // 缩放回 grid 中心
                const scale = size / 20;
                ctx.scale(scale, scale);
                ctx.translate(-10, -10); // 居中路径

                // 绘制蛇头 SVG
                ctx.shadowColor = this.colors.snakeGlow;
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#22c55e'; // 亮绿色蛇头
                const headPath = new Path2D(SVG_PATHS.snakeHead);
                ctx.fill(headPath);
                
                // 绘制眼睛（白色）
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(7, 9, 1.5, 0, Math.PI * 2);
                ctx.arc(13, 9, 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制眼珠（黑色）
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(7.5, 9, 0.7, 0, Math.PI * 2);
                ctx.arc(13.5, 9, 0.7, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
                return;
            }

            // 计算渐变进度 (0 = 头部, 1 = 尾部)
            const progress = index / Math.max(this.snake.length - 1, 1);
            // 透明度从1递减到0.3
            const alpha = 1 - progress * 0.7;

            // 颜色从青色 (6, 182, 212) 渐变到亮绿色系
            const r = Math.round(34 + (6 - 34) * (1 - progress));
            const g = Math.round(197 + (182 - 197) * (1 - progress));
            const b = Math.round(94 + (212 - 94) * (1 - progress));

            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

            // 绘制圆角矩形身体
            this.roundRect(
                ctx,
                x + padding,
                y + padding,
                size - padding * 2,
                size - padding * 2,
                index === this.snake.length - 1 ? 8 : 4 // 尾部更圆
            );
            ctx.fill();
        });

        // 重置阴影
        ctx.shadowBlur = 0;
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 获取当前分数
     */
    getScore() {
        return this.score;
    }

    /**
     * 获取游戏状态
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            score: this.score
        };
    }
}
