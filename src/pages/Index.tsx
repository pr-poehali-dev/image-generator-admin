import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const BROADCAST_API = 'https://functions.poehali.dev/3be572d1-d4ea-472d-8b09-c95a9fee6cd1';
const IMAGE_API = 'https://functions.poehali.dev/59a831f1-4acd-4196-9a1b-e654ad449ac1';

interface BroadcastMessage {
  id: number;
  message: string;
  createdAt: string;
}

export default function Index() {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [currentBroadcast, setCurrentBroadcast] = useState<BroadcastMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBroadcast = async () => {
    try {
      const response = await fetch(BROADCAST_API);
      const data = await response.json();
      if (data.message) {
        setCurrentBroadcast(data.message);
      }
    } catch (error) {
      console.error('Error fetching broadcast:', error);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите описание изображения',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(IMAGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: 'Готово! 🎨',
          description: 'Изображение успешно создано',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать изображение',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!adminMessage.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите сообщение',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const response = await fetch(BROADCAST_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({ message: adminMessage }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Отправлено! 📢',
          description: 'Сообщение доставлено всем пользователям',
        });
        setAdminMessage('');
        fetchBroadcast();
      } else {
        toast({
          title: 'Ошибка доступа',
          description: 'Неверный ключ администратора',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50">
      {currentBroadcast && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 animate-slide-up shadow-lg">
          <div className="container mx-auto flex items-center gap-3">
            <Icon name="Megaphone" size={24} className="flex-shrink-0 animate-pulse" />
            <p className="text-lg font-medium">{currentBroadcast.message}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-4">
            Генератор Изображений
          </h1>
          <p className="text-xl text-gray-600">Превратите слова в невероятные картины с помощью AI</p>
        </div>

        {currentBroadcast && (
          <div className="max-w-3xl mx-auto mb-8 animate-scale-in">
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 text-white">
                  <Icon name="Megaphone" size={32} className="flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Сообщение от администратора</h3>
                    <p className="text-lg leading-relaxed">{currentBroadcast.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <Card className="animate-scale-in shadow-2xl border-2 border-purple-200 hover:shadow-purple-300 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Icon name="Sparkles" size={28} className="text-purple-500" />
                Создайте изображение
              </CardTitle>
              <CardDescription>Опишите, что хотите увидеть</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Описание изображения</label>
                <Textarea
                  placeholder="Например: Космический кот в неоновых очках на фоне планет..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 text-base border-2 focus:border-purple-400 transition-colors"
                />
              </div>

              <Button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-glow"
              >
                {isGenerating ? (
                  <>
                    <Icon name="Loader2" size={24} className="mr-2 animate-spin" />
                    Создаём магию...
                  </>
                ) : (
                  <>
                    <Icon name="Wand2" size={24} className="mr-2" />
                    Сгенерировать
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-scale-in shadow-2xl border-2 border-pink-200 hover:shadow-pink-300 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Icon name="Image" size={28} className="text-pink-500" />
                Результат
              </CardTitle>
              <CardDescription>Ваше созданное изображение</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-purple-300">
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover animate-fade-in"
                  />
                ) : (
                  <div className="text-center p-8">
                    <Icon name="ImagePlus" size={64} className="mx-auto text-purple-300 mb-4" />
                    <p className="text-gray-500 text-lg">Здесь появится ваше изображение</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-6 right-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl hover:shadow-orange-300 transition-all duration-300 animate-pulse-glow"
              >
                <Icon name="Lock" size={28} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Icon name="ShieldAlert" size={28} className="text-orange-500" />
                  Админ-панель
                </DialogTitle>
                <DialogDescription>Отправить сообщение всем пользователям</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {currentBroadcast && (
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Icon name="MessageSquare" size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 mb-1">Текущее сообщение:</p>
                        <p className="text-base text-purple-800">{currentBroadcast.message}</p>
                        <p className="text-xs text-purple-600 mt-2">
                          Отправлено: {new Date(currentBroadcast.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ключ доступа</label>
                  <Input
                    type="password"
                    placeholder="misha123"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="border-2 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Новое сообщение</label>
                  <Textarea
                    placeholder="Hello everyone! 👋"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    className="min-h-24 border-2 focus:border-orange-400"
                  />
                </div>
                <Button
                  onClick={handleSendBroadcast}
                  disabled={isSendingBroadcast}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isSendingBroadcast ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={20} className="mr-2" />
                      Отправить всем
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}