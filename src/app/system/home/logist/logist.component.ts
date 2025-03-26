import {Component, OnInit} from '@angular/core';
import {MessageService} from "primeng/api";
import {UserService} from "../../shared/services/user.service";
import {Task, TaskStatus} from "../../shared/model/task";
import {User, UserRole} from "../../shared/model/user";
import {FormsModule} from "@angular/forms";
import {DatePipe, NgClass, NgForOf, NgIf, SlicePipe} from "@angular/common";
import {Router} from "@angular/router";
import {ZoneService} from "../../shared/services/zone.service";
import {TaskService} from "../../shared/services/task.service";

@Component({
  selector: 'home-logist',
  templateUrl: './logist.component.html',
  styleUrls: ['./logist.component.css'],
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    SlicePipe,
    NgForOf,
    NgIf
  ],
  providers: [MessageService]
})
export class LogistComponent implements OnInit {
  senderZones: string[] = [];
  receiverZones: string[] = [];
  minDeliveryDate: Date = new Date();
  tasks: Task[] = [];
  carriers: User[] = [];
  newTask: Partial<Task> = {};
  showCreateForm = false;

  loadingTasks: boolean = true;
  loadingCarriers: boolean = true;
  loadingZones: boolean = true;
  isCreatingTask: boolean = false;

  constructor(
      private router: Router,
      private userService: UserService,
      private taskService: TaskService,
      private zoneService: ZoneService,
      private messageService: MessageService
  ) {
  }

  async ngOnInit() {
    this.minDeliveryDate = new Date();
    this.minDeliveryDate.setHours(0, 0, 0, 0);
    await this.loadInitialData();
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  async loadInitialData() {
    try {
      this.loadingTasks = true;
      this.loadingCarriers = true;
      this.loadingZones = true;

      this.tasks = await this.taskService.getTasks()
      this.loadingTasks = false;

      this.carriers = await this.userService.getUsersByRole(UserRole.CARRIER);
      this.carriers = await Promise.all(
          this.carriers.map(async carrier => ({
            ...carrier,
            tasks: await this.taskService.getTasksByUser(carrier.email)
          }))
      );
      this.loadingCarriers = false;

      this.senderZones = await this.zoneService.getSenderZones().then(zone => zone.map(z => z.location));
      this.receiverZones = await this.zoneService.getReceiverZones().then(zone => zone.map(z => z.location));
      this.loadingZones = false;

      this.updateAllTasksStatus();
      this.updateCarriersProgress();
      this.setupAutoRefresh()

    } catch (error) {
      this.loadingTasks = false;
      this.loadingCarriers = false;
      this.loadingZones = false;
      this.showError('Ошибка загрузки данных');
    }
  }

  private setupAutoRefresh(): void {
    setInterval(() => {
      this.updateAllTasksStatus();
      this.updateCarriersProgress();
    }, 60000);
  }

  async createTask() {
    if (!this.validateTask()) return;

    try {
      this.isCreatingTask = true;

      const task: Task = {
        ...this.newTask,
        status: TaskStatus.IN_PROGRESS,
        carrier: this.assignToCarrier(),
        createdAt: new Date().toISOString()
      } as Task;

      await this.taskService.createTask(task);


      this.tasks.push(task);
      this.updateCarriersProgress();
      this.resetForm();

      this.showSuccess('Задание успешно создано');
      this.showCreateForm = false;
      await this.loadInitialData();
    } catch (error) {
      this.showError('Ошибка создания задания');
    } finally {
      this.isCreatingTask = false;
    }
  }

  private validateTask(): boolean {
    if (!this.newTask.senderAddress || !this.newTask.receiverAddress || !this.newTask.deliveryDate) {
      this.showError('Заполните все обязательные поля');
      return false;
    }

    if (new Date(this.newTask.deliveryDate) < new Date()) {
      this.showError('Дата доставки не может быть в прошлом');
      return false;
    }

    return true;
  }

  private assignToCarrier(): string {
    if (this.carriers.length === 0) {
      throw new Error('Нет доступных перевозчиков');
    }

    const carrierTasks = this.carriers.map(c => ({
      carrier: c,
      taskCount: c.tasks?.filter(t => t.status !== TaskStatus.DELIVERED).length || 0
    }));

    carrierTasks.sort((a, b) => a.taskCount - b.taskCount);
    return carrierTasks[0].carrier.email;
  }

  private updateAllTasksStatus(): void {
    this.tasks = this.tasks.map(task => ({
      ...task,
      remainingTime: this.calculateRemainingTime(task.deliveryDate),
      status: this.determineTaskStatus(task)
    }))
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === TaskStatus.IN_PROGRESS ? -1 : 1;
      }
      return a.remainingTime - b.remainingTime;
    });
  }

  private determineTaskStatus(task: Task): TaskStatus {
    const currentTime = new Date();
    const deliveryDate = new Date(task.deliveryDate);

    if (task.status === TaskStatus.DELIVERED) return TaskStatus.DELIVERED;
    if (currentTime > deliveryDate) return TaskStatus.OVERDUE;
    return TaskStatus.IN_PROGRESS;
  }

  private calculateRemainingTime(deliveryDate: string): number {
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const diff = delivery.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  private updateCarriersProgress(): void {
    this.carriers = this.carriers.map(carrier => {
      const carrierTasks = this.tasks.filter(t => t.carrier === carrier.email);
      const totalTasks = carrierTasks.length;
      const completedTasks = carrierTasks.filter(t => t.status === TaskStatus.DELIVERED).length;

      return {
        ...carrier,
        progress: totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0
      };
    });
  }

  private resetForm(): void {
    this.newTask = {};
    this.showCreateForm = false;
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Успех',
      detail: message
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: message
    });
  }

  protected readonly TaskStatus = TaskStatus;
}