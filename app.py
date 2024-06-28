from flask import Flask, render_template, request, jsonify
from haystack.document_stores import InMemoryDocumentStore
from haystack.nodes import BM25Retriever, FARMReader
from haystack.pipelines import ExtractiveQAPipeline
from haystack.pipelines.standard_pipelines import TextIndexingPipeline
from haystack.utils import print_answers
from haystack.nodes import FARMReader


import os
import psutil
import time

chat_history = []

app = Flask(__name__)

# Inisialisasi DocumentStore
document_store = InMemoryDocumentStore(use_bm25=True)

# Persiapan Dokumen
doc_dir = "squad_bert"
files_to_index = [os.path.join(doc_dir, f) for f in os.listdir(doc_dir)]
indexing_pipeline = TextIndexingPipeline(document_store)
indexing_pipeline.run_batch(file_paths=files_to_index)

# Inisialisasi Retriever
retriever = BM25Retriever(document_store=document_store)

# Inisialisasi Reader
model_dir = "modelakhir"
reader = FARMReader(model_name_or_path=model_dir, use_gpu=True)

# Buat Retriever-Reader Pipeline
pipe = ExtractiveQAPipeline(reader, retriever)

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        question = request.form.get('question')
        if question:
            answer = predict(question)
            chat_history.append({"sender": "Anda", "text": question})
            chat_history.append({"sender": "CoffeeBot", "text": answer})
        return render_template('index.html', chat_history=chat_history)
    else:
        if not chat_history:
            chat_history.append({"sender": "CoffeeBot", "text": "Hi. Selamat datang di chatbot kopi! Bagaimana saya bisa membantu Anda hari ini?"})
        return render_template('index.html', chat_history=chat_history)

@app.route('/ask', methods=['POST'])
def ask():
    question = request.form.get('question')
    if not question:
        return jsonify({"sender": "CoffeeBot", "text": "Silakan masukkan pertanyaan."})
    
    answer = predict(question)
    response = {"sender": "CoffeeBot", "text": answer}
    return jsonify(response)

@app.route('/about')
def about():
    return render_template('about.html')

def predict(question):
    greeting_responses = ["Hi", "Hello", "Halo"]
    if question.lower() in [g.lower() for g in greeting_responses]:
        return "Hi. Selamat datang di chatbot kopi! Bagaimana saya bisa membantu Anda hari ini?"

    try:
        #pengukuran waktu
        start_time = time.time()

        # penggunaan memori dan CPU sebelum inferensi
        process = psutil.Process(os.getpid())
        mem_before = process.memory_info().rss
        cpu_before = process.cpu_percent(interval=None)

        # jalankan inferensi
        prediction = pipe.run(query=question, params={"Retriever": {"top_k": 10}, "Reader": {"top_k": 5}})
        answers = prediction.get('answers', [])
        
        # log untuk skor dan jawaban
        for answer in answers:
            print(f"Answer: {answer.answer}, Score: {answer.score}")
        
        # penggunaan memori dan CPU setelah inferensi
        mem_after = process.memory_info().rss
        cpu_after = process.cpu_percent(interval=None)

        #Hitung waktu eksekusi
        end_time = time.time()
        elapsed_time = end_time - start_time

        #Hitung perubahan memori dan CPU
        mem_usage = mem_after - mem_before
        cpu_usage = cpu_after - cpu_before

        # Cetak log memori, CPU, dan waktu eksekusi
        print(f"Memory usage: {mem_usage / (1024 ** 2):.2f} MB")
        print(f"CPU usage: {cpu_usage:.2f} %")
        print(f"Inference time: {elapsed_time:.2f} seconds")
        print_answers(prediction, details="all")
        if answers:
            top_answers = [answer.answer for answer in answers[:1] if answer.score >= 0.5]
            if top_answers:
                return "<br>".join(top_answers)  
        return "Mohon maaf, pertanyaan belum dapat dijawab. Apakah ada pertanyaan lain?"
    except Exception as e:
        print(f"Error: {e}")
        return "Terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi."

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
