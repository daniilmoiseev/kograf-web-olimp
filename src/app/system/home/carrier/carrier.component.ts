import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from "../../shared/services/user.service";
import {TaskService} from "../../shared/services/task.service";
import {ZoneService} from "../../shared/services/zone.service";
import {Task, TaskStatus} from "../../shared/model/task";
import {Zone} from "../../shared/model/zone";
import {DatePipe, NgClass, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'home-carrier',
  templateUrl: './carrier.component.html',
  imports: [
    NgClass,
    DatePipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./carrier.component.css']
})
export class CarrierComponent implements OnInit {
  tasks: Task[] = [];
  zones: Zone[] = [];
  selectedTask: Task | null = null;
  availableZones: string[] = [];
  activeZones: string[] = [];
  currentSenderZones: string[] = [];
  currentReceiverZones: string[] = [];
  selectedZone: string | null = null;
  protected readonly TaskStatus = TaskStatus;

  constructor(
      private router: Router,
      private userService: UserService,
      private taskService: TaskService,
      private zoneService: ZoneService
  ) {
  }

  async ngOnInit() {
    await this.loadTasks();
    await this.loadZones();
    this.initializeAvailableZones();
  }

  async loadTasks() {
    const currentUser = await this.userService.getCurrentUser();
    this.tasks = await this.taskService.getTasksByUser(currentUser?.email!);

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

  async loadZones() {
    const senderZones = await this.zoneService.getSenderZones();
    const receiverZones = await this.zoneService.getReceiverZones();
    this.zones = [...senderZones, ...receiverZones];

    this.zones = this.zones.filter((zone, index, self) =>
        index === self.findIndex(z => z.location === zone.location)
    );
  }

  initializeAvailableZones() {
    this.availableZones = Array.from(new Set(
        this.tasks.flatMap(task => [task.senderAddress])
    ));
  }

  isAvailableZone(zoneLocation: string): boolean {
    return this.availableZones.includes(zoneLocation);
  }

  isActiveRouteZone(zoneLocation: string): boolean {
    return this.currentSenderZones.includes(zoneLocation) ||
        this.currentReceiverZones.includes(zoneLocation);
  }

  isSelfDelivery(zoneLocation: string): boolean {
    return this.tasks.some(task =>
        task.senderAddress === zoneLocation &&
        task.receiverAddress === zoneLocation
    );
  }

  isSelfDeliveryZone(zoneLocation: string): boolean {
    return this.currentSenderZones.includes(zoneLocation) &&
        this.currentReceiverZones.includes(zoneLocation) &&
        this.currentSenderZones.length === 1;
  }

  isSenderZone(zoneLocation: string): boolean {
    return this.tasks.some(task => task.senderAddress === zoneLocation);
  }

  toggleZoneSelection(zone: Zone) {
    if (!this.isSenderZone(zone.location)) return;

    if (this.isSelfDelivery(zone.location)) {
      const selfDeliveryTask = this.tasks.find(task =>
          task.senderAddress === zone.location &&
          task.receiverAddress === zone.location
      );

      if (selfDeliveryTask) {
        this.selectedTask = selfDeliveryTask;
        this.currentSenderZones = [zone.location];
        this.currentReceiverZones = [zone.location];
      }
    } else {
      if (this.selectedZone === zone.location) {
        this.cycleThroughTasks(zone.location);
      } else {
        this.selectedZone = zone.location;
        this.updateCurrentRoutes(zone.location);
      }
    }
  }

  getZoneClasses(zone: Zone): any {
    const isSender = this.currentSenderZones.includes(zone.location);
    const isReceiver = this.currentReceiverZones.includes(zone.location);
    const isSelfDelivery = isSender && isReceiver && this.currentSenderZones.length === 1;
    const isClickable = this.isSenderZone(zone.location);

    return {
      'border-green-400': isSender && !isSelfDelivery,
      'border-red-400': isReceiver && !isSelfDelivery,
      'border-purple-400': isSelfDelivery,
      'border-gray-400': !isSender && !isReceiver,
      'bg-white': !this.isAvailableZone(zone.location),
      'cursor-pointer': isClickable,
      'cursor-not-allowed opacity-50': !isClickable && !isReceiver
    };
  }

  updateCurrentRoutes(zoneLocation: string) {
    const relatedTasks = this.tasks.filter(t =>
        t.senderAddress === zoneLocation || t.receiverAddress === zoneLocation
    );

    this.currentSenderZones = Array.from(new Set(
        relatedTasks.map(t => t.senderAddress)
    ));

    this.currentReceiverZones = Array.from(new Set(
        relatedTasks.map(t => t.receiverAddress)
    ));

    if (relatedTasks.length === 1) {
      this.selectedTask = relatedTasks[0];
    }
  }

  cycleThroughTasks(zoneLocation: string) {
    const relatedTasks = this.tasks.filter(t =>
        t.senderAddress === zoneLocation || t.receiverAddress === zoneLocation
    );

    if (relatedTasks.length === 0) return;

    const currentIndex = this.selectedTask
        ? relatedTasks.findIndex(t => t.id === this.selectedTask?.id)
        : -1;

    const nextIndex = (currentIndex + 1) % relatedTasks.length;
    this.selectedTask = relatedTasks[nextIndex];

    this.updateCurrentRoutes(zoneLocation);
  }

  showTaskOnMap(task: Task) {
    this.selectedTask = task;
    this.selectedZone = task.senderAddress;
    this.currentSenderZones = [task.senderAddress];
    this.currentReceiverZones = [task.receiverAddress];
    this.activeZones = [...this.currentSenderZones, ...this.currentReceiverZones];
  }

  private determineTaskStatus(task: Task): TaskStatus {
    const currentTime = new Date();
    const deliveryDate = new Date(task.deliveryDate);

    if (task.status === TaskStatus.DELIVERED) return TaskStatus.DELIVERED;
    if (currentTime > deliveryDate) return TaskStatus.OVERDUE;
    return TaskStatus.IN_PROGRESS;
  }

  calculateRemainingTime(deliveryDate: string): number {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diff = delivery.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  async completeTask(task: Task | null) {
    if (task) {
      task.status = TaskStatus.DELIVERED;
      await this.taskService.updateTask(task);
      await this.loadTasks();
    }
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}